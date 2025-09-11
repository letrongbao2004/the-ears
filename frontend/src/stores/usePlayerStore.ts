import { create } from "zustand";
import type { Song } from "@/types";
import { useChatStore } from "./useChatStore";


interface PlayerStore {
	currentSong: Song | null;
	isPlaying: boolean;
	queue: Song[];
	currentIndex: number;
	showVideo: boolean;
	showKaraoke: boolean;
	showQueue: boolean;
	showGenreAnalysis: boolean;
	playedSongs: Song[];
	shuffleEnabled: boolean;
	repeatMode: 'off' | 'one' | 'all';

	initializeQueue: (songs: Song[]) => void;
	playAlbum: (songs: Song[], startIndex?: number) => void;
	setCurrentSong: (song: Song | null) => void;
	togglePlay: () => void;
	playNext: () => void;
	playPrevious: () => void;
	toggleVideo: () => void;
	setShowVideo: (show: boolean) => void;
	toggleKaraoke: () => void;
	setShowKaraoke: (show: boolean) => void;
	toggleQueue: () => void;
	toggleGenreAnalysis: () => void;
	stop: () => void;
	toggleShuffle: () => void;
	cycleRepeatMode: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
	currentSong: null,
	isPlaying: false,
	queue: [],
	currentIndex: -1,
	showVideo: false,
	showKaraoke: false,
	showQueue: false,
	showGenreAnalysis: false,
	playedSongs: [],
	shuffleEnabled: false,
	repeatMode: 'off',

	initializeQueue: (songs: Song[]) => {
		set({
			queue: songs,
			currentSong: get().currentSong || songs[0],
			currentIndex: get().currentIndex === -1 ? 0 : get().currentIndex,
		});
	},

playAlbum: (songs: Song[], startIndex = 0) => {
		if (songs.length === 0) return;

		const song = songs[startIndex];

		const socket = useChatStore.getState().socket;
		if (socket.auth) {
			socket.emit("update_activity", {
				userId: socket.auth.userId,
				activity: `Playing ${song.title} by ${song.artist}`,
			});
		}

		const previous = get().currentSong;
		set({
			queue: songs,
			currentSong: song,
			currentIndex: startIndex,
			isPlaying: true,
			playedSongs: previous ? [...get().playedSongs, previous] : get().playedSongs,
		});
	},

setCurrentSong: (song: Song | null) => {
		if (!song) return;

		const socket = useChatStore.getState().socket;
		if (socket.auth) {
			socket.emit("update_activity", {
				userId: socket.auth.userId,
				activity: `Playing ${song.title} by ${song.artist}`,
			});
		}

		const songIndex = get().queue.findIndex((s) => s._id === song._id);
		const previous = get().currentSong;
		set({
			currentSong: song,
			isPlaying: true,
			currentIndex: songIndex !== -1 ? songIndex : get().currentIndex,
			playedSongs: previous && previous._id !== song._id ? [...get().playedSongs, previous] : get().playedSongs,
		});
	},

	togglePlay: () => {
		const willStartPlaying = !get().isPlaying;

		const currentSong = get().currentSong;
		const socket = useChatStore.getState().socket;
		if (socket.auth) {
			socket.emit("update_activity", {
				userId: socket.auth.userId,
				activity:
					willStartPlaying && currentSong ? `Playing ${currentSong.title} by ${currentSong.artist}` : "Idle",
			});
		}

		set({
			isPlaying: willStartPlaying,
		});
	},

	playNext: () => {
		const { currentIndex, queue } = get();
		const shuffle = get().shuffleEnabled;
		const repeat = get().repeatMode;

		let nextIndex = currentIndex + 1;
		if (shuffle && queue.length > 1) {
			let rand = currentIndex;
			while (rand === currentIndex) {
				rand = Math.floor(Math.random() * queue.length);
			}
			nextIndex = rand;
		}

		// if there is a next song to play, let's play it
		if (nextIndex < queue.length) {
			const nextSong = queue[nextIndex];

			const socket = useChatStore.getState().socket;
			if (socket.auth) {
				socket.emit("update_activity", {
					userId: socket.auth.userId,
					activity: `Playing ${nextSong.title} by ${nextSong.artist}`,
				});
			}

			const previous = get().currentSong;
			set({
				currentSong: nextSong,
				currentIndex: nextIndex,
				isPlaying: true,
				playedSongs: previous ? [...get().playedSongs, previous] : get().playedSongs,
			});
		} else {
			// end of queue
			if (repeat === 'all' && queue.length > 0) {
				const wrappedIndex = 0;
				const nextSong = queue[wrappedIndex];
				const socket = useChatStore.getState().socket;
				if (socket.auth) {
					socket.emit("update_activity", {
						userId: socket.auth.userId,
						activity: `Playing ${nextSong.title} by ${nextSong.artist}`,
					});
				}
				const previous = get().currentSong;
				set({
					currentSong: nextSong,
					currentIndex: wrappedIndex,
					isPlaying: true,
					playedSongs: previous ? [...get().playedSongs, previous] : get().playedSongs,
				});
			} else if (repeat === 'one' && queue.length > 0) {
				const current = get().currentSong;
				if (current) {
					const socket = useChatStore.getState().socket;
					if (socket.auth) {
						socket.emit("update_activity", {
							userId: socket.auth.userId,
							activity: `Playing ${current.title} by ${current.artist}`,
						});
					}
					set({ isPlaying: true });
				}
			} else {
				set({ isPlaying: false });
				const socket = useChatStore.getState().socket;
				if (socket.auth) {
					socket.emit("update_activity", { userId: socket.auth.userId, activity: `Idle` });
				}
			}
		}
	},
	playPrevious: () => {
		const { currentIndex, queue } = get();
		const shuffle = get().shuffleEnabled;
		let prevIndex = currentIndex - 1;
		if (shuffle && queue.length > 1) {
			let rand = currentIndex;
			while (rand === currentIndex) {
				rand = Math.floor(Math.random() * queue.length);
			}
			prevIndex = rand;
		}

		// theres a prev song
		if (prevIndex >= 0) {
			const prevSong = queue[prevIndex];

			const socket = useChatStore.getState().socket;
			if (socket.auth) {
				socket.emit("update_activity", {
					userId: socket.auth.userId,
					activity: `Playing ${prevSong.title} by ${prevSong.artist}`,
				});
			}

			const previous = get().currentSong;
			set({
				currentSong: prevSong,
				currentIndex: prevIndex,
				isPlaying: true,
				playedSongs: previous ? [...get().playedSongs, previous] : get().playedSongs,
			});
		} else {
			// no prev song
			set({ isPlaying: false });

			const socket = useChatStore.getState().socket;
			if (socket.auth) {
				socket.emit("update_activity", {
					userId: socket.auth.userId,
					activity: `Idle`,
				});
			}
		}
	},

	toggleVideo: () => {
		set({ showVideo: !get().showVideo });
	},

	setShowVideo: (show: boolean) => {
		set({ showVideo: show });
	},

	toggleKaraoke: () => {
		set({ showKaraoke: !get().showKaraoke });
	},

	setShowKaraoke: (show: boolean) => {
		set({ showKaraoke: show });
	},

	toggleQueue: () => {
		set({ showQueue: !get().showQueue });
	},

	toggleGenreAnalysis: () => {
		set({ showGenreAnalysis: !get().showGenreAnalysis });
	},

	stop: () => {
		set({ isPlaying: false });
	},

	toggleShuffle: () => {
		set({ shuffleEnabled: !get().shuffleEnabled });
	},

	cycleRepeatMode: () => {
		const order: Array<'off' | 'one' | 'all'> = ['off', 'all', 'one'];
		const current = get().repeatMode;
		const next = order[(order.indexOf(current) + 1) % order.length];
		set({ repeatMode: next });
	},
}));