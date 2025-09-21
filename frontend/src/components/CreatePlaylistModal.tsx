import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { X } from "lucide-react";

interface CreatePlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreatePlaylistModal = ({ isOpen, onClose }: CreatePlaylistModalProps) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const { createPlaylist, isLoading } = usePlaylistStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            await createPlaylist(name.trim(), description.trim(), isPublic);
            setName("");
            setDescription("");
            setIsPublic(false);
            onClose();
        } catch (error) {
            console.error("Failed to create playlist:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Create Playlist</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Playlist Name *
                        </label>
                        <Input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter playlist name"
                            className="bg-zinc-700 border-zinc-600 text-white placeholder:text-gray-400"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description
                        </label>
                        <Input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter playlist description (optional)"
                            className="bg-zinc-700 border-zinc-600 text-white placeholder:text-gray-400"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-300">
                            Privacy Settings
                        </label>
                        
                        <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                                <input
                                    type="radio"
                                    id="private"
                                    name="privacy"
                                    checked={!isPublic}
                                    onChange={() => setIsPublic(false)}
                                    className="mt-1 text-green-500 focus:ring-green-500"
                                />
                                <div>
                                    <label htmlFor="private" className="text-sm text-white font-medium cursor-pointer">
                                        Private
                                    </label>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Only you can see and play this playlist
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-3">
                                <input
                                    type="radio"
                                    id="public"
                                    name="privacy"
                                    checked={isPublic}
                                    onChange={() => setIsPublic(true)}
                                    className="mt-1 text-green-500 focus:ring-green-500"
                                />
                                <div>
                                    <label htmlFor="public" className="text-sm text-white font-medium cursor-pointer">
                                        Public
                                    </label>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Anyone can see and play this playlist
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-gray-400 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!name.trim() || isLoading}
                            className="bg-green-500 hover:bg-green-400 text-black"
                        >
                            {isLoading ? "Creating..." : "Create Playlist"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePlaylistModal;

