import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { HeadphonesIcon, Music, Users, MessageCircle, UserPlus, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

const FriendsActivity = () => {
	const { users, fetchUsers, onlineUsers, userActivities, getUnreadCount, lastMessageFromUser, initSocket } = useChatStore();
	const { user } = useUser();
	const navigate = useNavigate();
	const [showUserMenu, setShowUserMenu] = useState<string | null>(null);
	const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

	useEffect(() => {
		if (user) {
			fetchUsers();
			// Ensure socket is initialized
			if (user.id) {
				initSocket(user.id);
			}
		}
	}, [fetchUsers, user, initSocket]);

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = () => {
			if (showUserMenu) {
				setShowUserMenu(null);
			}
		};

		if (showUserMenu) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	}, [showUserMenu]);

	const handleUserClick = (clickedUser: any, event: React.MouseEvent) => {
		event.stopPropagation();

		if (showUserMenu === clickedUser._id) {
			setShowUserMenu(null);
			return;
		}

		// Calculate menu position
		const rect = event.currentTarget.getBoundingClientRect();
		setMenuPosition({
			top: rect.top + window.scrollY,
			left: rect.left + window.scrollX - 200, // Position to the left of the user card
		});

		setShowUserMenu(clickedUser._id);
	};

	const handleStartChat = (targetUser: any) => {
		setShowUserMenu(null);
		// Navigate to chat with the selected user
		navigate(`/chat/${targetUser.clerkId}`);
	};

	const handleViewProfile = (targetUser: any) => {
		setShowUserMenu(null);
		// Navigate to user profile (if you have this route)
		navigate(`/profile/${targetUser.clerkId}`);
	};

	return (
		<div className='h-full bg-zinc-900 rounded-lg flex flex-col'>
			<div className='p-4 flex justify-between items-center border-b border-zinc-800'>
				<div className='flex items-center gap-2'>
					<Users className='size-5 shrink-0' />
					<h2 className='font-semibold'>What they're listening to</h2>
				</div>
			</div>

			{!user && <LoginPrompt />}

			<ScrollArea className='flex-1'>
				<div className='p-4 space-y-4'>
					{users.map((friendUser) => {
						const activity = userActivities.get(friendUser.clerkId);
						const isPlaying = activity && activity !== "Idle";
						const unreadCount = getUnreadCount(friendUser.clerkId);
						const lastMessage = lastMessageFromUser.get(friendUser.clerkId);
						const hasUnreadMessages = unreadCount > 0;

						return (
							<div key={friendUser._id} className="relative">
								<div
									onClick={(e) => handleUserClick(friendUser, e)}
									className='cursor-pointer hover:bg-zinc-800/50 p-3 rounded-md transition-all duration-200 group hover:scale-[1.02] active:scale-[0.98]'
									title={`Click to interact with ${friendUser.fullName}`}
								>
									<div className='flex items-start gap-3'>
										<div className='relative'>
											<Avatar className='size-10 border border-zinc-800'>
												<AvatarImage src={friendUser.imageUrl} alt={friendUser.fullName} />
												<AvatarFallback>{friendUser.fullName[0]}</AvatarFallback>
											</Avatar>
											<div
												className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-900 
													${onlineUsers.has(friendUser.clerkId) ? "bg-green-500" : "bg-zinc-500"}
													`}
												aria-hidden='true'
											/>
											{/* Message notification badge */}
											{hasUnreadMessages && (
												<div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold border-2 border-zinc-900 notification-glow message-notification">
													{unreadCount > 9 ? '9+' : unreadCount}
												</div>
											)}
										</div>

										<div className='flex-1 min-w-0'>
											<div className='flex items-center gap-2'>
												<span className='font-medium text-sm text-white'>{friendUser.fullName}</span>
												{isPlaying && <Music className='size-3.5 text-emerald-400 shrink-0' />}
												{hasUnreadMessages && <Mail className='size-3.5 text-red-400 shrink-0' />}
											</div>

											{/* Show last message if available, otherwise show activity */}
											{hasUnreadMessages && lastMessage ? (
												<div className='mt-1'>
													<div className='text-sm text-red-300 font-medium truncate'>
														💬 {lastMessage.content}
													</div>
													<div className='text-xs text-red-400'>
														New message • {new Date(lastMessage.createdAt).toLocaleTimeString('en-US', {
															hour: '2-digit',
															minute: '2-digit'
														})}
													</div>
												</div>
											) : isPlaying ? (
												<div className='mt-1'>
													<div className='mt-1 text-sm text-white font-medium truncate'>
														{activity.replace("Playing ", "").split(" by ")[0]}
													</div>
													<div className='text-xs text-zinc-400 truncate'>
														{activity.split(" by ")[1]}
													</div>
												</div>
											) : (
												<div className='mt-1 text-xs text-zinc-400'>Idle</div>
											)}
										</div>

										{/* Notification indicators */}
										<div className="flex items-center gap-1">
											{hasUnreadMessages && (
												<div className="bg-gradient-to-r from-red-500 to-red-600 rounded-full p-1 animate-pulse shadow-lg">
													<MessageCircle className="size-3 text-white" />
												</div>
											)}
											<div className="opacity-0 group-hover:opacity-100 transition-opacity">
												<MessageCircle className="size-4 text-gray-400" />
											</div>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</ScrollArea>

			{/* User Action Menu Portal */}
			{showUserMenu && createPortal(
				<div
					className="fixed bg-zinc-800/95 backdrop-blur-sm border border-zinc-700 rounded-lg shadow-2xl min-w-48 z-[9999]"
					style={{
						top: menuPosition.top,
						left: menuPosition.left,
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<div className="py-2">
						{(() => {
							const selectedUser = users.find(u => u._id === showUserMenu);
							if (!selectedUser) return null;

							const isOnline = onlineUsers.has(selectedUser.clerkId);
							const activity = userActivities.get(selectedUser.clerkId);
							const isPlaying = activity && activity !== "Idle";

							return (
								<>
									{/* User Info Header */}
									<div className="px-4 py-3 border-b border-zinc-700 bg-zinc-700/30">
										<div className="flex items-center gap-3">
											<div className="relative">
												<Avatar className="size-8 border border-zinc-600">
													<AvatarImage src={selectedUser.imageUrl} alt={selectedUser.fullName} />
													<AvatarFallback className="text-xs">{selectedUser.fullName[0]}</AvatarFallback>
												</Avatar>
												<div
													className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-800 
														${isOnline ? "bg-green-500" : "bg-zinc-500"}
													`}
												/>
											</div>
											<div className="flex-1 min-w-0">
												<div className="font-medium text-white text-sm truncate">
													{selectedUser.fullName}
												</div>
												<div className="text-xs text-zinc-400">
													{isOnline ? (isPlaying ? "Listening to music" : "Online") : "Offline"}
												</div>
											</div>
										</div>
									</div>

									{/* Action Buttons */}
									<div className="py-1">
										<button
											onClick={() => handleStartChat(selectedUser)}
											className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-zinc-700 hover:text-white transition-colors"
										>
											<MessageCircle className="h-4 w-4 text-blue-400" />
											<span>Start Chat</span>
											{(() => {
												const unreadCount = getUnreadCount(selectedUser.clerkId);
												return unreadCount > 0 && (
													<div className="ml-auto bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold">
														{unreadCount > 9 ? '9+' : unreadCount}
													</div>
												);
											})()}
										</button>

										<button
											onClick={() => handleViewProfile(selectedUser)}
											className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-zinc-700 hover:text-white transition-colors"
										>
											<UserPlus className="h-4 w-4 text-green-400" />
											<span>View Profile</span>
										</button>

										{/* Additional Info Section */}
										{(isPlaying || (() => {
											const unreadCount = getUnreadCount(selectedUser.clerkId);
											const lastMsg = lastMessageFromUser.get(selectedUser.clerkId);
											return unreadCount > 0 && lastMsg;
										})()) && (
												<div className="border-t border-zinc-700 mt-1 pt-1">
													{/* Unread Messages Info */}
													{(() => {
														const unreadCount = getUnreadCount(selectedUser.clerkId);
														const lastMsg = lastMessageFromUser.get(selectedUser.clerkId);
														return unreadCount > 0 && lastMsg && (
															<div className="px-4 py-2 border-b border-zinc-700/50">
																<div className="text-xs text-red-400 mb-1 flex items-center gap-1">
																	<Mail className="h-3 w-3" />
																	{unreadCount} unread message{unreadCount > 1 ? 's' : ''}
																</div>
																<div className="text-sm text-white font-medium truncate">
																	"{lastMsg.content}"
																</div>
																<div className="text-xs text-zinc-400">
																	{new Date(lastMsg.createdAt).toLocaleString()}
																</div>
															</div>
														);
													})()}

													{/* Currently Playing Info */}
													{isPlaying && (
														<div className="px-4 py-2">
															<div className="text-xs text-zinc-500 mb-1">Currently playing:</div>
															<div className="text-sm text-white font-medium truncate">
																{activity.replace("Playing ", "").split(" by ")[0]}
															</div>
															<div className="text-xs text-zinc-400 truncate">
																{activity.split(" by ")[1]}
															</div>
														</div>
													)}
												</div>
											)}
									</div>
								</>
							);
						})()}
					</div>
				</div>,
				document.body
			)}
		</div>
	);
};
export default FriendsActivity;

const LoginPrompt = () => (
	<div className='h-full flex flex-col items-center justify-center p-6 text-center space-y-4'>
		<div className='relative'>
			<div
				className='absolute -inset-1 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full blur-lg
       opacity-75 animate-pulse'
				aria-hidden='true'
			/>
			<div className='relative bg-zinc-900 rounded-full p-4'>
				<HeadphonesIcon className='size-8 text-emerald-400' />
			</div>
		</div>

		<div className='space-y-2 max-w-[250px]'>
			<h3 className='text-lg font-semibold text-white'>See What Friends Are Playing</h3>
			<p className='text-sm text-zinc-400'>Login to discover what music your friends are enjoying right now</p>
		</div>
	</div>
);