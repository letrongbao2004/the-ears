import { axiosInstance } from "@/lib/axios";
import type { Message, User } from "@/types";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { io } from "socket.io-client";

interface ChatStore {
	users: User[];
	isLoading: boolean;
	error: string | null;
	socket: any;
	isConnected: boolean;
	onlineUsers: Set<string>;
	userActivities: Map<string, string>;
	messages: Message[];
	selectedUser: User | null;
	unreadMessages: Map<string, number>; // userId -> count of unread messages
	lastMessageFromUser: Map<string, Message>; // userId -> last message from that user

	fetchUsers: () => Promise<void>;
	initSocket: (userId: string) => void;
	disconnectSocket: () => void;
	sendMessage: (receiverId: string, senderId: string, content: string) => void;
	fetchMessages: (userId: string) => Promise<void>;
	setSelectedUser: (user: User | null) => void;
	markMessagesAsRead: (userId: string) => void;
	getUnreadCount: (userId: string) => number;
	getTotalUnreadCount: () => number;
	markAsReadWhenViewing: (userId: string) => void;
}

const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

const socket = io(baseURL, {
	autoConnect: false, // only connect if user is authenticated
	withCredentials: true,
});

export const useChatStore = create<ChatStore>()(
	subscribeWithSelector((set, get) => ({
	users: [],
	isLoading: false,
	error: null,
	socket: socket,
	isConnected: false,
	onlineUsers: new Set(),
	userActivities: new Map(),
	messages: [],
	selectedUser: null,
	unreadMessages: new Map(),
	lastMessageFromUser: new Map(),

	setSelectedUser: (user) => {
		const previousUser = get().selectedUser;
		set({ selectedUser: user });
		
		// Mark messages as read for the PREVIOUS user when switching away
		if (previousUser && previousUser.clerkId !== user?.clerkId) {
			get().markMessagesAsRead(previousUser.clerkId);
		}
		
		// Also mark as read for the new user (when entering chat)
		if (user) {
			get().markMessagesAsRead(user.clerkId);
		}
	},

	markMessagesAsRead: (userId: string) => {
		set((state) => {
			const newUnreadMessages = new Map(state.unreadMessages);
			newUnreadMessages.delete(userId);
			return { unreadMessages: newUnreadMessages };
		});
	},

	markAsReadWhenViewing: (userId: string) => {
		// Only mark as read if user is currently viewing this conversation
		const currentUser = get().selectedUser;
		if (currentUser && currentUser.clerkId === userId) {
			get().markMessagesAsRead(userId);
		}
	},

	getUnreadCount: (userId: string) => {
		return get().unreadMessages.get(userId) || 0;
	},

	getTotalUnreadCount: () => {
		const unreadMessages = get().unreadMessages;
		let total = 0;
		for (const count of unreadMessages.values()) {
			total += count;
		}
		return total;
	},

	fetchUsers: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/users");
			const apiUsers = response.data as any[];
			const normalizedUsers = apiUsers.map((u) => ({
				...u,
				clerkId: u.clerkId ?? u.clerkID,
			}));
			set({ users: normalizedUsers });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},

	initSocket: (userId) => {
		if (!get().isConnected) {
			socket.auth = { userId };
			socket.connect();

			socket.on("connect", () => {
				set({ isConnected: true, error: null });
				socket.emit("user_connected", userId);
			});

			socket.on("disconnect", () => {
				set({ isConnected: false });
			});

			socket.on("users_online", (users: string[]) => {
				set({ onlineUsers: new Set(users) });
			});

			socket.on("activities", (activities: [string, string][]) => {
				set({ userActivities: new Map(activities) });
			});

			socket.on("user_connected", (userId: string) => {
				set((state) => ({
					onlineUsers: new Set([...state.onlineUsers, userId]),
				}));
			});

			socket.on("user_disconnected", (userId: string) => {
				set((state) => {
					const newOnlineUsers = new Set(state.onlineUsers);
					newOnlineUsers.delete(userId);
					return { onlineUsers: newOnlineUsers };
				});
			});

			socket.on("receive_message", (message: Message) => {
				set((state) => {
					const newMessages = [...state.messages, message];
					const newUnreadMessages = new Map(state.unreadMessages);
					const newLastMessageFromUser = new Map(state.lastMessageFromUser);
					
					// ALWAYS count as unread for notifications, regardless of selected user
					// The notification system should work even when user is in chat
					const currentCount = newUnreadMessages.get(message.senderId) || 0;
					const newCount = currentCount + 1;
					newUnreadMessages.set(message.senderId, newCount);
					
					// Update last message from this user
					newLastMessageFromUser.set(message.senderId, message);
					
					return {
						messages: newMessages,
						unreadMessages: newUnreadMessages,
						lastMessageFromUser: newLastMessageFromUser
					};
				});
			});

			socket.on("message_sent", (message: Message) => {
				set((state) => ({
					messages: [...state.messages, message],
				}));
			});

			// handle errors
			socket.on("message_error", (errMsg: string) => {
				set({ error: errMsg });
			});

			socket.on("connect_error", (err: any) => {
				set({ error: err?.message || "Socket connection error" });
			});

			socket.on("activity_updated", ({ userId, activity }) => {
				set((state) => {
					const newActivities = new Map(state.userActivities);
					newActivities.set(userId, activity);
					return { userActivities: newActivities };
				});
			});

			set({ isConnected: true });
		}
	},

	disconnectSocket: () => {
		if (get().isConnected) {
			// remove listeners to avoid duplicates on re-init
			socket.off("users_online");
			socket.off("activities");
			socket.off("user_connected");
			socket.off("user_disconnected");
			socket.off("receive_message");
			socket.off("message_sent");
			socket.off("message_error");
			socket.off("connect_error");
			socket.disconnect();
			set({ isConnected: false });
		}
	},

	sendMessage: async (receiverId, senderId, content) => {
		const socket = get().socket;
		
		if (!socket) {
			return;
		}

		if (!receiverId || !senderId || !content) {
			set({ error: "Missing receiver, sender or content" });
			return;
		}

		socket.emit("send_message", { receiverId, senderId, content });
	},

	fetchMessages: async (userId: string) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get(`/users/messages/${userId}`);
			set({ messages: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},
}))
);