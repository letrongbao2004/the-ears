
import { axiosInstance } from '@/lib/axios';
import type { Album, Song, Stats } from '@/types';
import toast from "react-hot-toast";
import {create} from 'zustand';

interface MusicStore {
    songs: Song[];
    albums: Album[];
    isLoading: boolean;
    error: string | null;
    currentAlbum: Album | null;
    madeForYouSongs: Song[];
    trendingSongs: Song[];
    featuredSongs: Song[];
    stats: Stats
    searchResults: {
        songs: Song[];
        albums: Album[];
    };
    searchQuery: string;
    isSearching: boolean;

    fetchAlbums: () => Promise<void>;
    fetchAlbumById: (id: string) => Promise<void>;
    fetchmadeForYouSongs: () => Promise<void>;
    fetchTrendingSongs: () => Promise<void>;
    fetchFeaturedSongs: () => Promise<void>;
    fetchStats: () => Promise<void>;
    fetchSongs: () => Promise<void>;
    deleteSong: (id: string) => Promise<void>;
	deleteAlbum: (id: string) => Promise<void>;
    searchMusic: (query: string) => Promise<void>;
    clearSearch: () => void;
}

export const useMusicStore = create<MusicStore>((set) => ({
    albums: [],
    songs: [],
    isLoading: false,
    error: null,
    currentAlbum: null,
    madeForYouSongs: [],
    trendingSongs: [],
    featuredSongs: [],
    stats: {
		totalSongs: 0,
		totalAlbums: 0,
		totalUsers: 0,
		totalArtists: 0,
	},

    searchResults: {
        songs: [],
        albums: [],
    },
    searchQuery: '',
    isSearching: false,

    deleteSong: async (id) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.delete(`/admin/songs/${id}`);

			set((state) => ({
				songs: state.songs.filter((song) => song._id !== id),
			}));
			toast.success("Song deleted successfully");
		} catch (error: any) {
			console.log("Error in deleteSong", error);
			toast.error("Error deleting song");
		} finally {
			set({ isLoading: false });
		}
	},

	deleteAlbum: async (id) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.delete(`/admin/albums/${id}`);
			set((state) => ({
				albums: state.albums.filter((album) => album._id !== id),
				songs: state.songs.map((song) =>
					song.albumId === state.albums.find((a) => a._id === id)?.title ? { ...song, album: null } : song
				),
			}));
			toast.success("Album deleted successfully");
		} catch (error: any) {
			toast.error("Failed to delete album: " + error.message);
		} finally {
			set({ isLoading: false });
		}
	},

    fetchSongs: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/songs");
			set({ songs: response.data });
		} catch (error: any) {
			set({ error: error.message });
		} finally {
			set({ isLoading: false });
		}
	},

	fetchStats: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/stats");
			set({ stats: response.data });
		} catch (error: any) {
			set({ error: error.message });
		} finally {
			set({ isLoading: false });
		}
	},

    fetchAlbums: async () => {
        set({ isLoading: true, error: null });

        try {
            const response = await axiosInstance.get("/albums");
            set({ albums: response.data });
        } catch (error: any) {
            set({ error: error.response.data.message });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchAlbumById: async (id) => {
        set({ isLoading: true, error: null });

        try {
            const response = await axiosInstance.get(`/albums/${id}`);
            set({ currentAlbum: response.data });
        } catch (error: any) {
            set({ error: error.response.data.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    fetchmadeForYouSongs: async () => {
        set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/songs/made-for-you");
			set({ madeForYouSongs: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
    },

    fetchTrendingSongs: async () => {
        set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/songs/trending");
			set({ trendingSongs: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
    },

    fetchFeaturedSongs: async () => {
        set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/songs/featured");
			set({ featuredSongs: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
    },

    searchMusic: async (query: string) => {
        if (!query.trim()) {
            set({ searchResults: { songs: [], albums: [] }, searchQuery: '' });
            return;
        }

        set({ isSearching: true, error: null, searchQuery: query });

        try {
            const [songsResponse, albumsResponse] = await Promise.all([
                axiosInstance.get(`/songs/search?q=${encodeURIComponent(query)}`),
                axiosInstance.get(`/albums/search?q=${encodeURIComponent(query)}`)
            ]);

            set({
                searchResults: {
                    songs: songsResponse.data,
                    albums: albumsResponse.data,
                },
            });
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Search failed' });
        } finally {
            set({ isSearching: false });
        }
    },

    clearSearch: () => {
        set({
            searchResults: { songs: [], albums: [] },
            searchQuery: '',
            isSearching: false,
        });
    },
}));