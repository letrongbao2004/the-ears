import { Play, MoreHorizontal, Trash2, Edit, Music, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Playlist } from "@/types";

interface PlaylistCardProps {
    playlist: Playlist;
    onEdit?: (playlist: Playlist) => void;
    showActions?: boolean;
}

const PlaylistCard = ({ playlist, onEdit, showActions = true }: PlaylistCardProps) => {
    const { playAlbum } = usePlayerStore();
    const { deletePlaylist } = usePlaylistStore();
    const [showMenu, setShowMenu] = useState(false);

    const handlePlay = () => {
        if (playlist.songs.length > 0) {
            playAlbum(playlist.songs, 0);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete "${playlist.name}"?\n\nThis action cannot be undone.`)) {
            try {
                await deletePlaylist(playlist._id);
            } catch (error) {
                console.error("Failed to delete playlist:", error);
                alert("Failed to delete playlist. Please try again.");
            }
        }
    };

    const getCoverImage = () => {
        if (playlist.coverImage) {
            return playlist.coverImage;
        }
        if (playlist.songs.length > 0) {
            return playlist.songs[0].imageUrl;
        }
        return "/logo.png"; // Default image
    };

    const getTotalDuration = () => {
        const totalSeconds = playlist.songs.reduce((acc, song) => acc + song.duration, 0);
        const minutes = Math.floor(totalSeconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`;
        }
        return `${minutes}m`;
    };

    return (
        <div className="group relative bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 backdrop-blur-sm rounded-xl p-6 hover:from-zinc-700/60 hover:to-zinc-800/60 transition-all duration-300 border border-zinc-700/50 hover:border-zinc-600/50">
            <div className="flex items-start gap-4">
                {/* Cover Image */}
                <div className="relative">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden shadow-lg">
                        <img
                            src={getCoverImage()}
                            alt={playlist.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                    <Button
                        size="icon"
                        onClick={handlePlay}
                        className="absolute -bottom-2 -right-2 bg-green-500 hover:bg-green-400 rounded-full w-10 h-10 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg"
                        disabled={playlist.songs.length === 0}
                    >
                        <Play className="h-5 w-5 text-black" />
                    </Button>
                </div>

                {/* Playlist Info */}
                <div className="flex-1 min-w-0">
                    <Link to={`/playlists/${playlist._id}`}>
                        <h3 className="font-bold text-white text-lg truncate hover:text-green-400 transition-colors cursor-pointer">
                            {playlist.name}
                        </h3>
                    </Link>
                    <p className="text-sm text-gray-300 truncate mt-1">
                        {playlist.description || "No description"}
                    </p>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                            <Music className="h-3 w-3" />
                            <span>{playlist.songs.length} song{playlist.songs.length !== 1 ? 's' : ''}</span>
                        </div>
                        {playlist.songs.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{getTotalDuration()}</span>
                            </div>
                        )}
                        {playlist.isPublic && (
                            <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>Public</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Menu */}
                {showActions && (
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowMenu(!showMenu)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white hover:bg-zinc-700/50"
                        >
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>

                        {showMenu && (
                            <div className="absolute right-0 top-8 bg-zinc-800/95 backdrop-blur-sm border border-zinc-700 rounded-lg shadow-xl z-10 min-w-40">
                                <div className="py-2">
                                    {onEdit && (
                                        <button
                                            onClick={() => {
                                                onEdit(playlist);
                                                setShowMenu(false);
                                            }}
                                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-300 hover:bg-zinc-700 hover:text-white transition-colors"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Edit Playlist
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            handleDelete();
                                            setShowMenu(false);
                                        }}
                                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Playlist
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Click outside to close menu */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowMenu(false)}
                />
            )}
        </div>
    );
};

export default PlaylistCard;
