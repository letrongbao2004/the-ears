import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useNavigate } from "react-router-dom";

interface SearchInputProps {
    placeholder?: string;
    className?: string;
}

const SearchInput = ({ placeholder = "Search for songs, albums, or artists...", className = "" }: SearchInputProps) => {
    const [localQuery, setLocalQuery] = useState("");
    const { searchMusic, clearSearch, searchQuery, isSearching, searchResults } = useMusicStore();
    const { setCurrentSong } = usePlayerStore();
    const navigate = useNavigate();
    
    // Debounce search to avoid too many API calls
    const debouncedQuery = useDebounce(localQuery, 300);

    useEffect(() => {
        if (debouncedQuery.trim()) {
            searchMusic(debouncedQuery);
        } else {
            clearSearch();
        }
    }, [debouncedQuery, searchMusic, clearSearch]);

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

    return (
        <div className={`relative ${className}`}>
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
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
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
                                                onClick={() => handleSongClick(song)}
                                                className="flex items-center gap-3 p-2 hover:bg-zinc-700 rounded cursor-pointer"
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
        </div>
    );
};

export default SearchInput;
