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
        <div className="group relative bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 backdrop-blur-sm rounded-xl overflow-hidden hover:from-zinc-700/60 hover:to-zinc-800/60 transition-all duration-300 border border-zinc-700/50 hover:border-zinc-600/50">
            {/* Cover Image Section */}
            <div className="relative h-48 overflow-hidden">
                <img
                    src={getCoverImage()}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Play Button */}
                <Button
                    size="icon"
                    onClick={handlePlay}
                    className="absolute bottom-4 right-4 bg-green-500 hover:bg-green-400 rounded-full w-14 h-14 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg"
                    disabled={playlist.songs.length === 0}
                >
                    <Play className="h-7 w-7 text-black" />
                </Button>

                {/* Privacy Badge */}
                <div className="absolute top-4 left-4">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${playlist.isPublic
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                        <Users className="h-4 w-4" />
                        <span>{playlist.isPublic ? 'Public' : 'Private'}</span>
                    </div>
                </div>

                {/* Actions Menu */}
                {showActions && (
                    <div className="absolute top-4 right-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowMenu(!showMenu)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-white hover:bg-black/30 w-10 h-10"
                        >
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>

                        {showMenu && (
                            <div className="absolute right-0 top-10 bg-zinc-800/95 backdrop-blur-sm border border-zinc-700 rounded-lg shadow-xl z-10 min-w-44">
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

            {/* Content Section */}
            <div className="p-5">
                {/* Playlist Title */}
                <Link to={`/playlists/${playlist._id}`}>
                    <h3 className="font-bold text-white text-xl leading-tight mb-3 hover:text-green-400 transition-colors cursor-pointer line-clamp-2">
                        {playlist.name}
                    </h3>
                </Link>

                {/* Description */}
                <p className="text-base text-gray-300 mb-4 line-clamp-2 leading-relaxed">
                    {playlist.description || "No description"}
                </p>

                {/* Creator info for public playlists */}
                {playlist.isPublic && playlist.user && (
                    <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-700/30 rounded-lg">
                        <img
                            src={playlist.user.imageUrl || "/logo.png"}
                            alt={playlist.user.fullName}
                            className="w-6 h-6 rounded-full flex-shrink-0"
                        />
                        <span className="text-sm text-gray-400 truncate">
                            by <span className="text-gray-300 font-medium">{playlist.user.fullName}</span>
                        </span>
                    </div>
                )}

                {/* Stats */}
                <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <Music className="h-4 w-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">{playlist.songs.length} song{playlist.songs.length !== 1 ? 's' : ''}</span>
                        </div>
                        {playlist.songs.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 flex-shrink-0" />
                                <span className="whitespace-nowrap">{getTotalDuration()}</span>
                            </div>
                        )}
                    </div>

                    {/* Updated date */}
                    <div className="text-xs text-gray-500">
                        Updated {new Date(playlist.updatedAt).toLocaleDateString()}
                    </div>
                </div>
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
