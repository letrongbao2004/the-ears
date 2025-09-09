import { useEffect, useState } from "react";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import CreatePlaylistModal from "@/components/CreatePlaylistModal";
import PlaylistCard from "@/components/PlaylistCard";

const PlaylistsPage = () => {
    const { playlists, fetchPlaylists, isLoading } = usePlaylistStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        fetchPlaylists();
    }, [fetchPlaylists]);

    return (
        <div className="h-full bg-black/20 backdrop-blur-sm rounded-md overflow-hidden">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">Your Playlists</h1>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-green-500 hover:bg-green-400 text-black"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Playlist
                    </Button>
                </div>

                <ScrollArea className="h-[calc(100vh-200px)]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                        </div>
                    ) : playlists.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {playlists.map((playlist) => (
                                <PlaylistCard
                                    key={playlist._id}
                                    playlist={playlist}
                                    showActions={true}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🎵</div>
                            <h2 className="text-xl font-semibold text-gray-300 mb-2">
                                No playlists yet
                            </h2>
                            <p className="text-gray-400 mb-4">
                                Create your first playlist to organize your music
                            </p>
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-green-500 hover:bg-green-400 text-black"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Playlist
                            </Button>
                        </div>
                    )}
                </ScrollArea>
            </div>

            <CreatePlaylistModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};

export default PlaylistsPage;
