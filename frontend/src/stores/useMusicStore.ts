
import { axiosInstance } from '@/lib/axios';
import type { Album, Song } from '@/types';
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
    searchResults: {
        songs: [],
        albums: [],
    },
    searchQuery: '',
    isSearching: false,

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