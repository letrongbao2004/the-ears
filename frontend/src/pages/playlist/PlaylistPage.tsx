import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, Clock, Plus, Trash2, Music, Users } from "lucide-react";
import { formatDuration } from "../album/AlbumPage";

const PlaylistPage = () => {
    const { playlistId } = useParams();
    const navigate = useNavigate();
    const { currentPlaylist, getPlaylistById, removeSongFromPlaylist, deletePlaylist, isLoading } = usePlaylistStore();
    const { currentSong, isPlaying, playAlbum, togglePlay } = usePlayerStore();
    // const [editingSong, setEditingSong] = useState<string | null>(null);
    // const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (playlistId) {
            getPlaylistById(playlistId);
        }
    }, [playlistId, getPlaylistById]);

    const handlePlayPlaylist = () => {
        if (!currentPlaylist || currentPlaylist.songs.length === 0) return;

        const isCurrentPlaylistPlaying = currentPlaylist.songs.some(
            (song) => song._id === currentSong?._id
        );

        if (isCurrentPlaylistPlaying) {
            togglePlay();
        } else {
            playAlbum(currentPlaylist.songs, 0);
        }
    };

    const handlePlaySong = (index: number) => {
        if (!currentPlaylist) return;
        playAlbum(currentPlaylist.songs, index);
    };

    const handleRemoveSong = async (songId: string) => {
        if (!playlistId) return;
        if (window.confirm("Are you sure you want to remove this song from the playlist?")) {
            try {
                await removeSongFromPlaylist(playlistId, songId);
            } catch (error) {
                console.error("Failed to remove song:", error);
                alert("Failed to remove song. Please try again.");
            }
        }
    };

    const handleDeletePlaylist = async () => {
        if (!playlistId) return;
        if (window.confirm(`Are you sure you want to delete "${currentPlaylist?.name}"?\n\nThis action cannot be undone.`)) {
            try {
                await deletePlaylist(playlistId);
                navigate("/playlists");
            } catch (error) {
                console.error("Failed to delete playlist:", error);
                alert("Failed to delete playlist. Please try again.");
            }
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (!currentPlaylist) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-300 mb-2">Playlist not found</h2>
                    <Button onClick={() => navigate("/")} className="bg-green-500 hover:bg-green-400">
                        Go Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <ScrollArea className="h-full rounded-md scrollbar-thin">
                <div className="relative min-h-full">
                    {/* Background gradient */}
                    <div
                        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 pointer-events-none"
                        aria-hidden="true"
                    />

                    {/* Content */}
                    <div className="relative z-10">
                        <div className="flex p-6 gap-6 pb-8">
                            <div className="relative">
                                <img
                                    src={
                                        currentPlaylist.coverImage ||
                                        (currentPlaylist.songs.length > 0
                                            ? currentPlaylist.songs[0].imageUrl
                                            : "/logo.png")
                                    }
                                    alt={currentPlaylist.name}
                                    className="w-[240px] h-[240px] shadow-2xl rounded-lg object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg" />
                            </div>
                            <div className="flex flex-col justify-end flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Music className="h-4 w-4 text-green-400" />
                                    <p className="text-sm font-medium text-green-400">Playlist</p>
                                </div>
                                <h1 className="text-6xl font-bold my-4 text-white">{currentPlaylist.name}</h1>
                                
                                {/* Creator info for public playlists */}
                                {currentPlaylist.isPublic && currentPlaylist.user && (
                                    <div className="flex items-center gap-3 mb-3">
                                        <img
                                            src={currentPlaylist.user.imageUrl || "/logo.png"}
                                            alt={currentPlaylist.user.fullName}
                                            className="w-6 h-6 rounded-full"
                                        />
                                        <span className="text-sm text-gray-300">
                                            Created by <span className="font-medium text-white">{currentPlaylist.user.fullName}</span>
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center gap-6 text-sm text-zinc-300 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Music className="h-4 w-4" />
                                        <span className="font-medium">
                                            {currentPlaylist.songs.length} song{currentPlaylist.songs.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    {currentPlaylist.songs.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            <span>
                                                {Math.floor(currentPlaylist.songs.reduce((acc, song) => acc + song.duration, 0) / 60)}m
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {currentPlaylist.isPublic ? (
                                            <>
                                                <Users className="h-4 w-4 text-green-400" />
                                                <span className="text-green-400 font-medium">Public</span>
                                            </>
                                        ) : (
                                            <>
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-400">Private</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {currentPlaylist.description && (
                                    <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
                                        {currentPlaylist.description}
                                    </p>
                                )}
                            </div>
                            
                            {/* Playlist Actions */}
                            <div className="flex flex-col gap-2">
                                <Button
                                    onClick={handleDeletePlaylist}
                                    variant="ghost"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Playlist
                                </Button>
                            </div>
                        </div>

                        {/* Play button */}
                        <div className="px-6 pb-4 flex items-center gap-6">
                            <Button
                                onClick={handlePlayPlaylist}
                                size="icon"
                                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 hover:scale-105 transition-all"
                                disabled={currentPlaylist.songs.length === 0}
                            >
                                {isPlaying &&
                                currentPlaylist.songs.some((song) => song._id === currentSong?._id) ? (
                                    <Pause className="h-7 w-7 text-black" />
                                ) : (
                                    <Play className="h-7 w-7 text-black" />
                                )}
                            </Button>
                        </div>

                        {/* Songs list */}
                        {currentPlaylist.songs.length > 0 ? (
                            <div className="bg-black/20 backdrop-blur-sm rounded-lg mx-6 mb-6">
                                {/* Table header */}
                                <div className="grid grid-cols-[16px_4fr_2fr_1fr_40px] gap-4 px-6 py-4 text-sm text-zinc-400 border-b border-white/10">
                                    <div className="flex items-center justify-center">#</div>
                                    <div className="font-medium">Title</div>
                                    <div className="font-medium">Album</div>
                                    <div className="flex items-center justify-center">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <div></div>
                                </div>

                                {/* Songs */}
                                <div className="px-2">
                                    <div className="space-y-1 py-2">
                                        {currentPlaylist.songs.map((song, index) => {
                                            const isCurrentSong = currentSong?._id === song._id;
                                            return (
                                                <div
                                                    key={song._id}
                                                    className="grid grid-cols-[16px_4fr_2fr_1fr_40px] gap-4 px-4 py-3 text-sm text-zinc-400 hover:bg-white/5 rounded-lg group cursor-pointer transition-colors"
                                                >
                                                    <div className="flex items-center justify-center">
                                                        {isCurrentSong && isPlaying ? (
                                                            <div className="size-4 text-green-500 animate-pulse">♫</div>
                                                        ) : (
                                                            <span className="group-hover:hidden text-zinc-500">{index + 1}</span>
                                                        )}
                                                        {!isCurrentSong && (
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => handlePlaySong(index)}
                                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-green-400"
                                                            >
                                                                <Play className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div
                                                        className="flex items-center gap-3"
                                                        onClick={() => handlePlaySong(index)}
                                                    >
                                                        <img
                                                            src={song.imageUrl}
                                                            alt={song.title}
                                                            className="size-10 rounded object-cover"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <div className={`font-medium text-white truncate ${isCurrentSong ? 'text-green-400' : ''}`}>
                                                                {song.title}
                                                            </div>
                                                            <div className="text-zinc-400 truncate">{song.artist}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center text-zinc-400">
                                                        {song.albumId ? "Album" : "Single"}
                                                    </div>

                                                    <div className="flex items-center justify-center text-zinc-400">
                                                        {formatDuration(song.duration)}
                                                    </div>

                                                    <div className="flex items-center justify-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveSong(song._id);
                                                            }}
                                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                                            title="Remove from playlist"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🎵</div>
                                <h2 className="text-xl font-semibold text-gray-300 mb-2">
                                    No songs yet
                                </h2>
                                <p className="text-gray-400 mb-4">
                                    Add songs to this playlist to get started
                                </p>
                                <Button
                                    onClick={() => navigate("/search")}
                                    className="bg-green-500 hover:bg-green-400"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Songs
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};

export default PlaylistPage;