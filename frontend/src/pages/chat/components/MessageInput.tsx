import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { Send } from "lucide-react";
import { useState, useRef } from "react";

const MessageInput = () => {
	const [newMessage, setNewMessage] = useState("");
	const { user } = useUser();
	const { selectedUser, sendMessage } = useChatStore();
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSend = () => {
		if (!selectedUser || !user || !newMessage.trim()) return;
		if (selectedUser.clerkId === user.id) return; // prevent chatting to self

		const messageToSend = newMessage.trim();
		sendMessage(selectedUser.clerkId, user.id, messageToSend);
		setNewMessage("");

		// Focus back to input after sending
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	return (
		<div className='p-4 mt-auto border-t border-zinc-800'>
			<div className='flex gap-2'>
				<Input
					ref={inputRef}
					placeholder='Type a message'
					value={newMessage}
					onChange={(e) => setNewMessage(e.target.value)}
					className='bg-zinc-800 border-none'
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSend();
						}
					}}
				/>

				<Button size={"icon"} onClick={handleSend} disabled={!newMessage.trim()}>
					<Send className='size-4' />
				</Button>
			</div>
		</div>
	);
};
export default MessageInput;