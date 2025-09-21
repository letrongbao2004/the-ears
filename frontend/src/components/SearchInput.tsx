import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { useEffect, useState, useRef } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useNavigate } from "react-router-dom";
import { Plus, Music } from "lucide-react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

interface SearchInputProps {
    placeholder?: string;
    className?: string;
}

const SearchInput = ({ placeholder = "Search for songs, albums, or artists...", className = "" }: SearchInputProps) => {
    const [localQuery, setLocalQuery] = useState("");
    const { searchMusic, clearSearch, searchQuery, isSearching, searchResults } = useMusicStore();
    const { setCurrentSong } = usePlayerStore();
    const { playlists, fetchPlaylists, addSongToPlaylist } = usePlaylistStore();
    const navigate = useNavigate();
    const [showPlaylistMenu, setShowPlaylistMenu] = useState<string | null>(null);
    const [lastSearchQuery, setLastSearchQuery] = useState("");
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    // Debounce search to avoid too many API calls
    const debouncedQuery = useDebounce(localQuery, 500); // Tăng debounce time

    useEffect(() => {
        if (debouncedQuery.trim() && debouncedQuery !== lastSearchQuery) {
            setLastSearchQuery(debouncedQuery);
            searchMusic(debouncedQuery);
        } else if (!debouncedQuery.trim()) {
            setLastSearchQuery("");
            clearSearch();
        }
    }, [debouncedQuery, searchMusic, clearSearch, lastSearchQuery]);

    useEffect(() => {
        fetchPlaylists();
    }, [fetchPlaylists]);

    // Close menu on scroll or resize
    useEffect(() => {
        const handleScrollOrResize = () => {
            if (showPlaylistMenu) {
                setShowPlaylistMenu(null);
            }
        };

        if (showPlaylistMenu) {
            window.addEventListener('scroll', handleScrollOrResize, true);
            window.addEventListener('resize', handleScrollOrResize);
        }

        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [showPlaylistMenu]);

    const handleClear = () => {
        setLocalQuery("");
        clearSearch();
    };

    const handleSongClick = (song: any) => {
        setCurrentSong(song);
    };

    const handleAlbumClick = (album: any) => {
        navigate(`/albums/${album._id}`);
    };

    const handleAddToPlaylist = async (songId: string, playlistId: string) => {
        try {
            const playlist = playlists.find(p => p._id === playlistId);
            const song = searchResults.songs.find(s => s._id === songId);

            await addSongToPlaylist(playlistId, songId);
            setShowPlaylistMenu(null);

            // Show success toast
            toast.success(
                `Added "${song?.title}" to "${playlist?.name}"`,
                {
                    duration: 4000,
                    position: 'top-right',
                    style: {
                        background: '#10B981',
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                        zIndex: 9999,
                    },
                    iconTheme: {
                        primary: 'white',
                        secondary: '#10B981',
                    },
                }
            );
        } catch (error) {
            console.error("Failed to add song to playlist:", error);
            toast.error("Failed to add song to playlist", {
                duration: 4000,
                position: 'top-right',
                style: {
                    background: '#EF4444',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                    zIndex: 9999,
                },
                iconTheme: {
                    primary: 'white',
                    secondary: '#EF4444',
                },
            });
        }
    };

    return (
        <div className={`relative ${className}`}>
            {/* Click outside to close playlist menu */}
            {showPlaylistMenu && createPortal(
                <div
                    className="fixed inset-0"
                    style={{ zIndex: 9998 }}
                    onClick={() => setShowPlaylistMenu(null)}
                />,
                document.body
            )}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    type="text"
                    placeholder={placeholder}
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    className="pl-10 pr-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-400 focus:border-green-500"
                />
                {localQuery && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-[60] max-h-96 overflow-y-auto scrollbar-thin">
                    {isSearching ? (
                        <div className="p-4 text-center text-gray-400">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto mb-2"></div>
                            Searching...
                        </div>
                    ) : (
                        <div className="p-2">
                            {/* Songs Results */}
                            {searchResults.songs.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-2 px-2">Songs</h3>
                                    <div className="space-y-1">
                                        {searchResults.songs.slice(0, 5).map((song) => (
                                            <div
                                                key={song._id}
                                                className="flex items-center gap-3 p-2 hover:bg-zinc-700 rounded group"
                                            >
                                                <div
                                                    onClick={() => handleSongClick(song)}
                                                    className="flex items-center gap-3 flex-1 cursor-pointer"
                                                >
                                                    <img
                                                        src={song.imageUrl}
                                                        alt={song.title}
                                                        className="w-10 h-10 rounded object-cover"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-white truncate">{song.title}</div>
                                                        <div className="text-sm text-gray-400 truncate">{song.artist}</div>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <Button
                                                        ref={(el) => {
                                                            buttonRefs.current[song._id] = el;
                                                        }}
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (showPlaylistMenu === song._id) {
                                                                setShowPlaylistMenu(null);
                                                            } else {
                                                                const button = buttonRefs.current[song._id];
                                                                if (button) {
                                                                    const rect = button.getBoundingClientRect();
                                                                    setMenuPosition({
                                                                        top: rect.bottom + window.scrollY + 4,
                                                                        left: rect.right + window.scrollX - 200, // 200px là width của menu
                                                                    });
                                                                }
                                                                setShowPlaylistMenu(song._id);
                                                            }
                                                        }}
                                                        className="opacity-70 hover:opacity-100 transition-opacity text-gray-400 hover:text-white h-8 w-8"
                                                        title="Add to playlist"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>


                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Albums Results */}
                            {searchResults.albums.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-300 mb-2 px-2">Albums</h3>
                                    <div className="space-y-1">
                                        {searchResults.albums.slice(0, 5).map((album) => (
                                            <div
                                                key={album._id}
                                                onClick={() => handleAlbumClick(album)}
                                                className="flex items-center gap-3 p-2 hover:bg-zinc-700 rounded cursor-pointer"
                                            >
                                                <img
                                                    src={album.imageUrl}
                                                    alt={album.title}
                                                    className="w-10 h-10 rounded object-cover"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-white truncate">{album.title}</div>
                                                    <div className="text-sm text-gray-400 truncate">{album.artist}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* No Results */}
                            {searchResults.songs.length === 0 &&
                                searchResults.albums.length === 0 && (
                                    <div className="p-4 text-center text-gray-400">
                                        No results found for "{searchQuery}"
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            )}

            {/* Playlist Menu Portal */}
            {showPlaylistMenu && createPortal(
                <div
                    className="fixed bg-zinc-800/95 backdrop-blur-sm border border-zinc-700 rounded-lg shadow-2xl min-w-52 max-h-64 overflow-y-auto scrollbar-thin"
                    style={{
                        top: menuPosition.top,
                        left: menuPosition.left,
                        zIndex: 9999,
                    }}
                >
                    <div className="py-2">
                        <div className="px-4 py-2 text-sm font-medium text-gray-300 border-b border-zinc-700 bg-zinc-700/50">
                            Add to Playlist
                        </div>
                        {playlists.length > 0 ? (
                            <div className="max-h-40 overflow-y-auto scrollbar-hover">
                                {playlists.map((playlist) => (
                                    <button
                                        key={playlist._id}
                                        onClick={() => handleAddToPlaylist(showPlaylistMenu!, playlist._id)}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-zinc-700 hover:text-white transition-colors"
                                        title={playlist.name}
                                    >
                                        <Music className="h-4 w-4 flex-shrink-0" />
                                        <span className="truncate">{playlist.name}</span>
                                        {playlist.isPublic && (
                                            <span className="text-xs text-green-400 ml-auto">Public</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">
                                No playlists yet
                            </div>
                        )}
                        <div className="border-t border-zinc-700 mt-1">
                            <button
                                onClick={() => {
                                    setShowPlaylistMenu(null);
                                    navigate("/playlists");
                                }}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-green-400 hover:bg-zinc-700 hover:text-green-300 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Create New Playlist
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default SearchInput;
