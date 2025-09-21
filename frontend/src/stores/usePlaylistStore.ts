import { axiosInstance } from '@/lib/axios';
import type { Playlist } from '@/types';
import { create } from 'zustand';

interface PlaylistStore {
    playlists: Playlist[];
    publicPlaylists: Playlist[];
    currentPlaylist: Playlist | null;
    isLoading: boolean;
    error: string | null;

    // Playlist CRUD operations
    fetchPlaylists: () => Promise<void>;
    fetchPublicPlaylists: () => Promise<void>;
    createPlaylist: (name: string, description?: string, isPublic?: boolean) => Promise<void>;
    updatePlaylist: (playlistId: string, updates: Partial<Playlist>) => Promise<void>;
    deletePlaylist: (playlistId: string) => Promise<void>;
    getPlaylistById: (playlistId: string) => Promise<void>;

    // Song management
    addSongToPlaylist: (playlistId: string, songId: string) => Promise<void>;
    removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;

    // Utility functions
    clearError: () => void;
    setCurrentPlaylist: (playlist: Playlist | null) => void;
}

export const usePlaylistStore = create<PlaylistStore>((set) => ({
    playlists: [],
    publicPlaylists: [],
    currentPlaylist: null,
    isLoading: false,
    error: null,

    fetchPlaylists: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get('/playlists');
            set({ playlists: response.data });
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to fetch playlists' });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchPublicPlaylists: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get('/playlists/public');
            set({ publicPlaylists: response.data });
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to fetch public playlists' });
        } finally {
            set({ isLoading: false });
        }
    },

    createPlaylist: async (name, description = '', isPublic = false) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.post('/playlists', {
                name,
                description,
                isPublic
            });
            
            set((state) => ({
                playlists: [response.data, ...state.playlists]
            }));
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to create playlist' });
        } finally {
            set({ isLoading: false });
        }
    },

    updatePlaylist: async (playlistId, updates) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.put(`/playlists/${playlistId}`, updates);
            
            set((state) => ({
                playlists: state.playlists.map(playlist => 
                    playlist._id === playlistId ? response.data : playlist
                ),
                currentPlaylist: state.currentPlaylist?._id === playlistId ? response.data : state.currentPlaylist
            }));
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to update playlist' });
        } finally {
            set({ isLoading: false });
        }
    },

    deletePlaylist: async (playlistId) => {
        set({ isLoading: true, error: null });
        try {
            await axiosInstance.delete(`/playlists/${playlistId}`);
            
            set((state) => ({
                playlists: state.playlists.filter(playlist => playlist._id !== playlistId),
                currentPlaylist: state.currentPlaylist?._id === playlistId ? null : state.currentPlaylist
            }));
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to delete playlist' });
        } finally {
            set({ isLoading: false });
        }
    },

    getPlaylistById: async (playlistId) => {
    set({ isLoading: true, error: null });
    try {
        const response = await axiosInstance.get(`/playlists/${playlistId}`);
        set({ currentPlaylist: response.data, error: null });
    } catch (error: any) {
        set({ currentPlaylist: null, error: error.response?.data?.message || 'Failed to fetch playlist' });
    } finally {
        set({ isLoading: false });
    }
},

    addSongToPlaylist: async (playlistId, songId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.post(`/playlists/${playlistId}/songs`, { songId });
            
            set((state) => ({
                playlists: state.playlists.map(playlist => 
                    playlist._id === playlistId ? response.data : playlist
                ),
                currentPlaylist: state.currentPlaylist?._id === playlistId ? response.data : state.currentPlaylist
            }));
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to add song to playlist' });
        } finally {
            set({ isLoading: false });
        }
    },

    removeSongFromPlaylist: async (playlistId, songId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.delete(`/playlists/${playlistId}/songs/${songId}`);
            
            set((state) => ({
                playlists: state.playlists.map(playlist => 
                    playlist._id === playlistId ? response.data : playlist
                ),
                currentPlaylist: state.currentPlaylist?._id === playlistId ? response.data : state.currentPlaylist
            }));
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to remove song from playlist' });
        } finally {
            set({ isLoading: false });
        }
    },

    clearError: () => set({ error: null }),
    setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),
}));

