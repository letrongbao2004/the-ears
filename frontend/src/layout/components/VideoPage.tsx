import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { BarChart3 } from "lucide-react";

const YT_ORIGIN = window.location.origin;

const VideoPage = () => {
	const { currentSong, showGenreAnalysis, toggleGenreAnalysis } = usePlayerStore();
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
			const params = new URLSearchParams({ autoplay: "1", mute: "1", enablejsapi: "1", origin: YT_ORIGIN });
			return `https://www.youtube.com/embed/${id}?${params.toString()}`;
		} catch {
			return url;
		}
	};

	// Sync native video time to audio
	useEffect(() => {
		const audio = document.querySelector("audio") as HTMLAudioElement | null;
		const video = videoRef.current;
		if (!audio || !video) return;

		let isUserSeeking = false;
		let lastSyncTime = 0;

		const sync = () => {
			if (isUserSeeking) return;
			const now = Date.now();
			// Throttle sync to avoid too frequent updates
			if (now - lastSyncTime < 100) return;
			lastSyncTime = now;

			const timeDiff = Math.abs(video.currentTime - audio.currentTime);
			if (timeDiff > 0.1) {
				video.currentTime = audio.currentTime;
			}
		};

		const handleSeekStart = () => {
			isUserSeeking = true;
		};

		const handleSeekEnd = () => {
			isUserSeeking = false;
			// Force sync after user stops seeking
			video.currentTime = audio.currentTime;
		};

		// Listen to audio events
		audio.addEventListener("timeupdate", sync);
		audio.addEventListener("seeked", sync);
		audio.addEventListener("seeking", handleSeekStart);
		audio.addEventListener("seeked", handleSeekEnd);

		// Listen to video events to detect user interaction
		video.addEventListener("seeking", handleSeekStart);
		video.addEventListener("seeked", handleSeekEnd);

		return () => {
			audio.removeEventListener("timeupdate", sync);
			audio.removeEventListener("seeked", sync);
			audio.removeEventListener("seeking", handleSeekStart);
			audio.removeEventListener("seeked", handleSeekEnd);
			video.removeEventListener("seeking", handleSeekStart);
			video.removeEventListener("seeked", handleSeekEnd);
		};
	}, [currentSong?.videoUrl]);

	// Sync YouTube iframe time to audio via postMessage API
	useEffect(() => {
		const audio = document.querySelector("audio") as HTMLAudioElement | null;
		const iframe = iframeRef.current;
		if (!audio || !iframe) return;

		let rafId = 0;
		let lastSeekTime = 0;
		let isUserSeeking = false;

		const post = (command: any) => {
			iframe.contentWindow?.postMessage(JSON.stringify(command), "*");
		};

		const playMuted = () => post({ event: "command", func: "playVideo", args: [] });
		const pause = () => post({ event: "command", func: "pauseVideo", args: [] });
		const seekTo = (t: number) => post({ event: "command", func: "seekTo", args: [t, true] });
		const setMute = () => post({ event: "command", func: "mute", args: [] });

		const tick = () => {
			if (!isUserSeeking) {
				const now = Date.now();
				// Throttle YouTube seeks to avoid too frequent API calls
				if (now - lastSeekTime > 200) {
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
			// Force sync after user stops seeking
			seekTo(audio.currentTime);
		};

		// ensure muted + playing
		setMute();
		playMuted();
		rafId = requestAnimationFrame(tick);

		const handlePlay = () => playMuted();
		const handlePause = () => pause();
		const handleSeek = () => {
			if (!isUserSeeking) {
				seekTo(audio.currentTime);
			}
		};

		audio.addEventListener("play", handlePlay);
		audio.addEventListener("pause", handlePause);
		audio.addEventListener("seeked", handleSeek);
		audio.addEventListener("seeking", handleSeekStart);
		audio.addEventListener("seeked", handleSeekEnd);

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
						/>
					) : (
						<video ref={videoRef} src={currentSong.videoUrl} className='w-full h-full' muted autoPlay playsInline controls />
					)
				) : (
					<div className='text-zinc-400 text-sm'>No video available</div>
				)}
				
				{/* Genre Analysis Toggle Button */}
				<button
					onClick={toggleGenreAnalysis}
					className={`absolute top-4 right-4 p-2 rounded-md transition-colors ${
						showGenreAnalysis 
							? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
							: 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300'
					}`}
					title="Toggle Genre Analysis"
				>
					<BarChart3 className="w-5 h-5" />
				</button>
			</div>
		</div>
	);
};

export default VideoPage;
