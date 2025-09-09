import { useEffect, useState } from "react";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { Button } from "@/components/ui/button";
import { Play, Pause, Plus, Music } from "lucide-react";
import { Link } from "react-router-dom";
import SearchInput from "@/components/SearchInput";

const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const SearchPage = () => {
    const { searchResults, searchQuery, isSearching, clearSearch } = useMusicStore();
    const { currentSong, isPlaying, setCurrentSong, playAlbum, togglePlay } = usePlayerStore();
    const { playlists, fetchPlaylists, addSongToPlaylist } = usePlaylistStore();
    // const [localQuery, setLocalQuery] = useState("");
    const [showPlaylistMenu, setShowPlaylistMenu] = useState<string | null>(null);

    useEffect(() => {
        // Fetch playlists when component mounts
        fetchPlaylists();
        
        // Clear search when component unmounts
        return () => {
            clearSearch();
        };
    }, [clearSearch, fetchPlaylists]);

    // const handleSongClick = (song: any) => {
    //     setCurrentSong(song);
    // };

    const handlePlaySong = (song: any) => {
        const isCurrentSong = currentSong?._id === song._id;
        if (isCurrentSong) {
            togglePlay();
        } else {
            setCurrentSong(song);
        }
    };

    const handlePlayAlbum = (album: any) => {
        playAlbum(album.songs, 0);
    };

    const handleAddToPlaylist = async (songId: string, playlistId: string) => {
        try {
            await addSongToPlaylist(playlistId, songId);
            setShowPlaylistMenu(null);
        } catch (error) {
            console.error("Failed to add song to playlist:", error);
        }
    };

    const hasResults = searchResults.songs.length > 0 || searchResults.albums.length > 0;

    return (
        <div className="h-full bg-black/20 backdrop-blur-sm rounded-md overflow-hidden">
            {/* Click outside to close playlist menu */}
            {showPlaylistMenu && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowPlaylistMenu(null)}
                />
            )}
            <div className="p-6">
                <h1 className="text-3xl font-bold mb-6">Search</h1>
                
                {/* Search Input */}
                <div className="mb-8">
                    <SearchInput 
                        placeholder="What do you want to listen to?"
                        className="max-w-2xl"
                    />
                </div>

                {/* Search Results */}
                {searchQuery && (
                    <div className="space-y-8">
                        {isSearching ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                                <span className="ml-3 text-gray-400">Searching...</span>
                            </div>
                        ) : hasResults ? (
                            <>
                                {/* Songs Section */}
                                {searchResults.songs.length > 0 && (
                                    <div>
                                        <h2 className="text-2xl font-bold mb-4">Songs</h2>
                                        <div className="space-y-2">
                                            {searchResults.songs.map((song) => {
                                                const isCurrentSong = currentSong?._id === song._id;
                                                return (
                                                    <div
                                                        key={song._id}
                                                        className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-lg group"
                                                    >
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <img
                                                                src={song.imageUrl}
                                                                alt={song.title}
                                                                className="w-12 h-12 rounded object-cover"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-white truncate">
                                                                    {song.title}
                                                                </div>
                                                                <div className="text-sm text-gray-400 truncate">
                                                                    {song.artist}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-sm text-gray-400">
                                                                {formatDuration(song.duration)}
                                                            </div>
                                                            <div className="relative">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => setShowPlaylistMenu(showPlaylistMenu === song._id ? null : song._id)}
                                                                    className="opacity-70 hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                                                                    title="Add to playlist"
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                                
                                                                {showPlaylistMenu === song._id && (
                                                                    <div className="absolute right-0 top-8 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-10 min-w-48">
                                                                        <div className="py-1">
                                                                            <div className="px-3 py-2 text-sm text-gray-300 border-b border-zinc-700">
                                                                                Add to Playlist
                                                                            </div>
                                                                            {playlists.length > 0 ? (
                                                                                playlists.map((playlist) => (
                                                                                    <button
                                                                                        key={playlist._id}
                                                                                        onClick={() => handleAddToPlaylist(song._id, playlist._id)}
                                                                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-zinc-700 hover:text-white"
                                                                                    >
                                                                                        <Music className="h-4 w-4" />
                                                                                        {playlist.name}
                                                                                    </button>
                                                                                ))
                                                                            ) : (
                                                                                <div className="px-3 py-2 text-sm text-gray-400">
                                                                                    No playlists yet
                                                                                </div>
                                                                            )}
                                                                            <div className="border-t border-zinc-700 mt-1">
                                                                                <Link
                                                                                    to="/playlists"
                                                                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-400 hover:bg-zinc-700 hover:text-green-300"
                                                                                    onClick={() => setShowPlaylistMenu(null)}
                                                                                >
                                                                                    <Plus className="h-4 w-4" />
                                                                                    Create New Playlist
                                                                                </Link>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => handlePlaySong(song)}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                {isCurrentSong && isPlaying ? (
                                                                    <Pause className="h-4 w-4" />
                                                                ) : (
                                                                    <Play className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Albums Section */}
                                {searchResults.albums.length > 0 && (
                                    <div>
                                        <h2 className="text-2xl font-bold mb-4">Albums</h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {searchResults.albums.map((album) => (
                                                <div
                                                    key={album._id}
                                                    className="bg-zinc-800/50 rounded-lg p-4 hover:bg-zinc-700/50 transition-colors group"
                                                >
                                                    <div className="relative mb-4">
                                                        <img
                                                            src={album.imageUrl}
                                                            alt={album.title}
                                                            className="w-full aspect-square rounded object-cover"
                                                        />
                                                        <Button
                                                            size="icon"
                                                            onClick={() => handlePlayAlbum(album)}
                                                            className="absolute bottom-2 right-2 bg-green-500 hover:bg-green-400 rounded-full w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Play className="h-6 w-6 text-black" />
                                                        </Button>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-white truncate mb-1">
                                                            {album.title}
                                                        </h3>
                                                        <p className="text-sm text-gray-400 truncate">
                                                            {album.artist} • {album.releaseYear}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🔍</div>
                                <h2 className="text-xl font-semibold text-gray-300 mb-2">
                                    No results found
                                </h2>
                                <p className="text-gray-400">
                                    Try searching for something else
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!searchQuery && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎵</div>
                        <h2 className="text-xl font-semibold text-gray-300 mb-2">
                            Find your music
                        </h2>
                        <p className="text-gray-400">
                            Search for songs, albums, or artists
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
