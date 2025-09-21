import Topbar from "@/components/Topbar";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import UsersList from "./components/UsersList";
import ChatHeader from "./components/ChatHeader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import MessageInput from "./components/MessageInput";
import { useAutoScroll } from "@/hooks/useAutoScroll";

const formatTime = (date: string) => {
	return new Date(date).toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
};

const ChatPage = () => {
	const { user } = useUser();
	const { userId } = useParams();
	const { messages, selectedUser, users, fetchUsers, fetchMessages, setSelectedUser, markAsReadWhenViewing, error } = useChatStore();
	
	// Auto scroll hook
	const { endRef, containerRef, scrollToBottom } = useAutoScroll([messages], 100);

	useEffect(() => {
		if (user) fetchUsers();
	}, [fetchUsers, user]);

	// Auto-select user if userId is provided in URL
	useEffect(() => {
		if (userId && users.length > 0 && !selectedUser) {
			const targetUser = users.find(u => u.clerkId === userId);
			if (targetUser) {
				setSelectedUser(targetUser);
			}
		}
	}, [userId, users, selectedUser, setSelectedUser]);

	useEffect(() => {
		if (selectedUser) fetchMessages(selectedUser.clerkId);
	}, [selectedUser, fetchMessages]);

	// Additional scroll when selecting a new user
	useEffect(() => {
		if (selectedUser && messages.length > 0) {
			setTimeout(() => {
				scrollToBottom();
				// Mark as read when viewing messages
				markAsReadWhenViewing(selectedUser.clerkId);
			}, 300);
		}
	}, [selectedUser, scrollToBottom, markAsReadWhenViewing]);

	// Mark as read when new messages arrive and user is viewing
	useEffect(() => {
		if (selectedUser && messages.length > 0) {
			// Small delay to ensure user sees the message
			setTimeout(() => {
				markAsReadWhenViewing(selectedUser.clerkId);
			}, 1000);
		}
	}, [messages.length, selectedUser, markAsReadWhenViewing]);



	return (
		<main className='h-full rounded-lg bg-gradient-to-b from-zinc-800 to-zinc-900 overflow-hidden'>
			<Topbar />

			<div className='grid lg:grid-cols-[300px_1fr] grid-cols-[80px_1fr] h-[calc(100vh-180px)]'>
				<UsersList />

				{/* chat message */}
				<div className='flex flex-col h-full'>
					{error && (
						<div className='bg-red-600/20 text-red-300 text-sm px-3 py-2'>
							{error}
						</div>
					)}
					{selectedUser ? (
						<>
							<ChatHeader />

							{/* Messages */}
							<ScrollArea 
								className='h-[calc(100vh-340px)]' 
								ref={containerRef}
							>
								<div className='p-4 space-y-4'>
									{messages.map((message) => (
										<div
											key={message._id}
											className={`flex items-start gap-3 ${
												message.senderId === user?.id ? "flex-row-reverse" : ""
											}`}
										>
											<Avatar className='size-8'>
												<AvatarImage
													src={
														message.senderId === user?.id
															? user.imageUrl
															: selectedUser.imageUrl
													}
												/>
											</Avatar>

											<div
												className={`rounded-lg p-3 max-w-[70%]
													${message.senderId === user?.id ? "bg-green-500" : "bg-zinc-800"}
												`}
											>
												<p className='text-sm'>{message.content}</p>
												<span className='text-xs text-zinc-300 mt-1 block'>
													{formatTime(message.createdAt)}
												</span>
											</div>
										</div>
									))}
									{/* Invisible element to scroll to */}
									<div ref={endRef} className="h-1" />
								</div>
							</ScrollArea>

							<MessageInput />
						</>
					) : (
						<NoConversationPlaceholder />
					)}
				</div>
			</div>
		</main>
	);
};
export default ChatPage;

const NoConversationPlaceholder = () => (
	<div className='flex flex-col items-center justify-center h-full space-y-6'>
		<img src='/logo.png' alt='Spotify' className='size-16 animate-bounce' />
		<div className='text-center'>
			<h3 className='text-zinc-300 text-lg font-medium mb-1'>No conversation selected</h3>
			<p className='text-zinc-500 text-sm'>Choose a friend to start chatting</p>
		</div>
	</div>
);