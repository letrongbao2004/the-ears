import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { BarChart3, Palette } from "lucide-react";

const YT_ORIGIN = window.location.origin;

const VideoPage = () => {
	const { currentSong, showGenreAnalysis, toggleGenreAnalysis, showEmotionColors, toggleEmotionColors } = usePlayerStore();
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const iframeRef = useRef<HTMLIFrameElement | null>(null);

	const isYouTubeUrl = (url: string) => /(?:youtube\.com\/.+v=|youtu\.be\/)/i.test(url);
	const getYouTubeEmbedUrl = (url: string) => {
		try {
			const u = new URL(url);
			let id = "";
			if (u.hostname.includes("youtu.be")) {
				id = u.pathname.replace("/", "");
			} else {
				id = u.searchParams.get("v") || "";
			}
			if (!id) return url;
			const params = new URLSearchParams({
				autoplay: "1",
				mute: "1",
				enablejsapi: "1",
				origin: YT_ORIGIN,
				controls: "0",
				disablekb: "1",
				fs: "0",
				modestbranding: "1"
			});
			return `https://www.youtube.com/embed/${id}?${params.toString()}`;
		} catch {
			return url;
		}
	};

	// Optimized sync for native video to audio
	useEffect(() => {
		const audio = document.querySelector("audio") as HTMLAudioElement | null;
		const video = videoRef.current;
		if (!audio || !video) return;

		let isUserSeeking = false;
		let lastSyncTime = 0;
		let syncRafId = 0;

		// Use requestAnimationFrame for smoother sync
		const sync = () => {
			if (isUserSeeking) {
				syncRafId = requestAnimationFrame(sync);
				return;
			}

			const now = performance.now();
			// Throttle sync to 30fps for better performance
			if (now - lastSyncTime < 33.33) {
				syncRafId = requestAnimationFrame(sync);
				return;
			}
			lastSyncTime = now;

			const timeDiff = Math.abs(video.currentTime - audio.currentTime);
			// Increase tolerance to reduce frequent seeking
			if (timeDiff > 0.2) {
				video.currentTime = audio.currentTime;
			}

			syncRafId = requestAnimationFrame(sync);
		};

		const handleSeekStart = () => {
			isUserSeeking = true;
		};

		const handleSeekEnd = () => {
			isUserSeeking = false;
			// Debounce sync after seeking
			setTimeout(() => {
				if (!isUserSeeking) {
					video.currentTime = audio.currentTime;
				}
			}, 100);
		};

		// Start sync loop
		syncRafId = requestAnimationFrame(sync);

		// Listen to audio events with passive listeners for better performance
		audio.addEventListener("seeking", handleSeekStart, { passive: true });
		audio.addEventListener("seeked", handleSeekEnd, { passive: true });

		// Listen to video events to detect user interaction
		video.addEventListener("seeking", handleSeekStart, { passive: true });
		video.addEventListener("seeked", handleSeekEnd, { passive: true });

		return () => {
			cancelAnimationFrame(syncRafId);
			audio.removeEventListener("seeking", handleSeekStart);
			audio.removeEventListener("seeked", handleSeekEnd);
			video.removeEventListener("seeking", handleSeekStart);
			video.removeEventListener("seeked", handleSeekEnd);
		};
	}, [currentSong?.videoUrl]);

	// Optimized YouTube iframe sync to audio via postMessage API
	useEffect(() => {
		const audio = document.querySelector("audio") as HTMLAudioElement | null;
		const iframe = iframeRef.current;
		if (!audio || !iframe) return;

		let rafId = 0;
		let lastSeekTime = 0;
		let isUserSeeking = false;
		let commandQueue: any[] = [];
		let isProcessingQueue = false;

		// Batch commands to reduce postMessage frequency
		const post = (command: any) => {
			commandQueue.push(command);
			if (!isProcessingQueue) {
				isProcessingQueue = true;
				setTimeout(() => {
					commandQueue.forEach(cmd => {
						iframe.contentWindow?.postMessage(JSON.stringify(cmd), "*");
					});
					commandQueue = [];
					isProcessingQueue = false;
				}, 16); // ~60fps batching
			}
		};

		const playMuted = () => post({ event: "command", func: "playVideo", args: [] });
		const pause = () => post({ event: "command", func: "pauseVideo", args: [] });
		const seekTo = (t: number) => post({ event: "command", func: "seekTo", args: [t, true] });
		const setMute = () => post({ event: "command", func: "mute", args: [] });

		const tick = () => {
			if (!isUserSeeking) {
				const now = performance.now();
				// Reduce YouTube API call frequency for smoother performance
				if (now - lastSeekTime > 500) { // Increased from 200ms to 500ms
					seekTo(audio.currentTime);
					lastSeekTime = now;
				}
			}
			rafId = requestAnimationFrame(tick);
		};

		const handleSeekStart = () => {
			isUserSeeking = true;
		};

		const handleSeekEnd = () => {
			isUserSeeking = false;
			// Debounce sync after seeking to avoid rapid API calls
			setTimeout(() => {
				if (!isUserSeeking) {
					seekTo(audio.currentTime);
				}
			}, 200);
		};

		// Initialize YouTube player with optimized settings
		setTimeout(() => {
			setMute();
			playMuted();
		}, 100); // Small delay to ensure iframe is ready

		rafId = requestAnimationFrame(tick);

		const handlePlay = () => {
			// Debounce play commands
			setTimeout(() => playMuted(), 50);
		};
		const handlePause = () => {
			// Debounce pause commands
			setTimeout(() => pause(), 50);
		};
		const handleSeek = () => {
			if (!isUserSeeking) {
				// Debounce seek commands
				setTimeout(() => seekTo(audio.currentTime), 100);
			}
		};

		// Use passive listeners for better performance
		audio.addEventListener("play", handlePlay, { passive: true });
		audio.addEventListener("pause", handlePause, { passive: true });
		audio.addEventListener("seeked", handleSeek, { passive: true });
		audio.addEventListener("seeking", handleSeekStart, { passive: true });
		audio.addEventListener("seeked", handleSeekEnd, { passive: true });

		return () => {
			cancelAnimationFrame(rafId);
			audio.removeEventListener("play", handlePlay);
			audio.removeEventListener("pause", handlePause);
			audio.removeEventListener("seeked", handleSeek);
			audio.removeEventListener("seeking", handleSeekStart);
			audio.removeEventListener("seeked", handleSeekEnd);
		};
	}, [currentSong?.videoUrl]);

	return (
		<div className='h-full w-full flex justify-center items-center p-4'>
			{/* Video Section - Full width since analysis panel is now in sidebar */}
			<div className='w-full max-w-6xl aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center relative'>
				{currentSong?.videoUrl ? (
					isYouTubeUrl(currentSong.videoUrl) ? (
						<iframe
							ref={iframeRef}
							title='video'
							src={getYouTubeEmbedUrl(currentSong.videoUrl)}
							className='w-full h-full'
							allow='autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
							allowFullScreen
							style={{ pointerEvents: 'none' }}
						/>
					) : (
						<video
							ref={videoRef}
							src={currentSong.videoUrl}
							className='w-full h-full'
							muted
							autoPlay
							playsInline
							preload="metadata"
							style={{
								willChange: 'transform',
								transform: 'translateZ(0)',
								backfaceVisibility: 'hidden',
								pointerEvents: 'none'
							}}
						/>
					)
				) : (
					<div className='text-zinc-400 text-sm'>No video available</div>
				)}

				{/* Analysis Toggle Buttons */}
				<div className="absolute top-4 right-4 flex space-x-2">
					{/* Genre Analysis Toggle Button */}
					<button
						onClick={toggleGenreAnalysis}
						className={`p-2 rounded-md transition-colors ${showGenreAnalysis
							? 'bg-emerald-600 hover:bg-emerald-700 text-white'
							: 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300'
							}`}
						title="Toggle Genre Analysis"
					>
						<BarChart3 className="w-5 h-5" />
					</button>

					{/* Emotion Color Analysis Toggle Button */}
					<button
						onClick={toggleEmotionColors}
						className={`p-2 rounded-md transition-colors ${showEmotionColors
							? 'bg-purple-600 hover:bg-purple-700 text-white'
							: 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300'
							}`}
						title="Toggle Emotion Color Analysis"
					>
						<Palette className="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	);
};

export default VideoPage;
