import { useEffect, useState } from "react";
import { usePlaylistStore } from "@/stores/usePlaylistStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Users, Lock } from "lucide-react";
import CreatePlaylistModal from "@/components/CreatePlaylistModal";
import EditPlaylistModal from "@/components/EditPlaylistModal";
import PlaylistCard from "@/components/PlaylistCard";
import type { Playlist } from "@/types";

const PlaylistsPage = () => {
    const { playlists, publicPlaylists, fetchPlaylists, fetchPublicPlaylists, isLoading } = usePlaylistStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
    const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');

    const handleEditPlaylist = (playlist: Playlist) => {
        setEditingPlaylist(playlist);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingPlaylist(null);
    };

    useEffect(() => {
        fetchPlaylists();
        fetchPublicPlaylists();
    }, [fetchPlaylists, fetchPublicPlaylists]);

    const currentPlaylists = activeTab === 'my' ? playlists : publicPlaylists;
    const showActions = activeTab === 'my'; // Only show actions for user's own playlists

    return (
        <div className="h-full bg-black/20 backdrop-blur-sm rounded-md overflow-hidden">
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold">Playlists</h1>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-green-500 hover:bg-green-400 text-black w-full sm:w-auto"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Playlist
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 mb-6 bg-zinc-800/50 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 sm:flex-none ${activeTab === 'my'
                            ? 'bg-green-500 text-black'
                            : 'text-gray-400 hover:text-white hover:bg-zinc-700/50'
                            }`}
                    >
                        <Lock className="h-4 w-4" />
                        <span className="hidden sm:inline">My Playlists</span>
                        <span className="sm:hidden">My</span>
                        <span className="ml-1">({playlists.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('public')}
                        className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 sm:flex-none ${activeTab === 'public'
                            ? 'bg-green-500 text-black'
                            : 'text-gray-400 hover:text-white hover:bg-zinc-700/50'
                            }`}
                    >
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Public Playlists</span>
                        <span className="sm:hidden">Public</span>
                        <span className="ml-1">({publicPlaylists.length})</span>
                    </button>
                </div>

                <ScrollArea className="h-[calc(100vh-280px)] px-1 scrollbar-thin">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                        </div>
                    ) : currentPlaylists.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {currentPlaylists.map((playlist) => (
                                <PlaylistCard
                                    key={playlist._id}
                                    playlist={playlist}
                                    showActions={showActions}
                                    onEdit={showActions ? handleEditPlaylist : undefined}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">
                                {activeTab === 'my' ? '🎵' : '🌍'}
                            </div>
                            <h2 className="text-xl font-semibold text-gray-300 mb-2">
                                {activeTab === 'my' ? 'No playlists yet' : 'No public playlists'}
                            </h2>
                            <p className="text-gray-400 mb-4">
                                {activeTab === 'my'
                                    ? 'Create your first playlist to organize your music'
                                    : 'No public playlists available at the moment'
                                }
                            </p>
                            {activeTab === 'my' && (
                                <Button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="bg-green-500 hover:bg-green-400 text-black"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Playlist
                                </Button>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </div>

            <CreatePlaylistModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            <EditPlaylistModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                playlist={editingPlaylist}
            />
        </div>
    );
};

export default PlaylistsPage;
