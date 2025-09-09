import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useRef } from "react";

const VideoPlayer = () => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const { currentSong, isPlaying, showVideo } = usePlayerStore();

	// Sync video with audio
	useEffect(() => {
		const video = videoRef.current;
		const audio = (window as any).audioElement;

		if (!video || !audio || !currentSong?.videoUrl) return;

		const syncVideoWithAudio = () => {
			if (Math.abs(video.currentTime - audio.currentTime) > 0.1) {
				video.currentTime = audio.currentTime;
			}
		};

		const handleTimeUpdate = () => {
			syncVideoWithAudio();
		};

		const handleSeeked = () => {
			syncVideoWithAudio();
		};

		// Add event listeners
		audio.addEventListener('timeupdate', handleTimeUpdate);
		audio.addEventListener('seeked', handleSeeked);

		return () => {
			audio.removeEventListener('timeupdate', handleTimeUpdate);
			audio.removeEventListener('seeked', handleSeeked);
		};
	}, [currentSong]);

	// Handle play/pause sync
	useEffect(() => {
		const video = videoRef.current;
		const audio = (window as any).audioElement;

		if (!video || !audio || !currentSong?.videoUrl) return;

		if (isPlaying) {
			video.play().catch(console.error);
		} else {
			video.pause();
		}
	}, [isPlaying, currentSong]);

	// Handle song changes
	useEffect(() => {
		const video = videoRef.current;
		if (!video || !currentSong?.videoUrl) return;

		video.src = currentSong.videoUrl;
		video.currentTime = 0;
	}, [currentSong]);

	if (!showVideo || !currentSong?.videoUrl) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 bg-black">
			<video
				ref={videoRef}
				className="w-full h-full object-contain"
				muted
				playsInline
				onLoadedMetadata={() => {
					// Ensure video starts at the same time as audio
					const audio = (window as any).audioElement;
					if (audio && videoRef.current) {
						videoRef.current.currentTime = audio.currentTime;
					}
				}}
			/>
		</div>
	);
};

export default VideoPlayer;
