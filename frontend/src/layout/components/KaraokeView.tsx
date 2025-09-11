import { usePlayerStore } from "@/stores/usePlayerStore";
import { parseLRC } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type TimedLyricLine = { time: number; text: string };

const KaraokeView = () => {
	const { currentSong, showKaraoke } = usePlayerStore();
	const [karaokeLines, setKaraokeLines] = useState<TimedLyricLine[]>([]);
	const [karaokeIndex, setKaraokeIndex] = useState(0);
	const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
	const lastManualScrollRef = useRef<number>(0);

	// Parse karaoke lines when song lyrics change
	useEffect(() => {
		if (!currentSong?.lyrics) {
			setKaraokeLines([]);
			setKaraokeIndex(0);
			return;
		}
		const lines = parseLRC(currentSong.lyrics);
		setKaraokeLines(lines);
		setKaraokeIndex(0);
	}, [currentSong?.lyrics]);

	// Track manual scrolls to temporarily suppress auto-centering
	useEffect(() => {
		const container = lyricsContainerRef.current;
		if (!container) return;
		const onScroll = () => {
			lastManualScrollRef.current = Date.now();
		};
		container.addEventListener("scroll", onScroll);
		return () => container.removeEventListener("scroll", onScroll);
	}, []);

	// Auto-center active line when it changes, unless user scrolled recently
	useEffect(() => {
		if (!showKaraoke) return;
		const container = lyricsContainerRef.current;
		if (!container) return;
		const msSinceManual = Date.now() - lastManualScrollRef.current;
		if (msSinceManual < 2000) return; // pause auto-center for 2s after manual scroll
		const active = container.children[karaokeIndex] as HTMLElement | undefined;
		if (active && typeof active.scrollIntoView === "function") {
			active.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}, [karaokeIndex, showKaraoke]);

	// Sync with audio time (highlight only)
	useEffect(() => {
		const audio = document.querySelector("audio");
		if (!audio || !showKaraoke) return;

		const updateTime = () => {
			if (karaokeLines.length > 0) {
				let idx = 0;
				for (let i = 0; i < karaokeLines.length; i++) {
					if (karaokeLines[i].time <= audio.currentTime + 0.05) {
						idx = i;
					} else {
						break;
					}
				}
				setKaraokeIndex(idx);
			}
		};

		audio.addEventListener("timeupdate", updateTime);
		return () => audio.removeEventListener("timeupdate", updateTime);
	}, [karaokeLines, showKaraoke]);

	if (!showKaraoke || !currentSong) return null;

	return (
		<div className='h-full flex flex-col bg-black/50 backdrop-blur-sm'>
			{/* Header */}
			<div className='flex items-center justify-center p-4 border-b border-zinc-700 text-center'>
				<div className='flex-1'>
					<h2 className='text-2xl font-bold text-white mb-1'>{currentSong.title}</h2>
					<p className='text-base text-zinc-400'>{currentSong.artist}</p>
				</div>
			</div>
			
			{/* Karaoke Content */}
			<div className='flex-1 p-4 overflow-hidden'>
				{karaokeLines.length > 0 ? (
					<div
						ref={lyricsContainerRef}
						className='h-full text-zinc-200 text-base leading-7 overflow-auto pr-2 text-center scrollbar-hide'
					>
						{karaokeLines.map((line, idx) => (
							<div 
								key={idx} 
								className={`transition-all duration-500 ease-in-out transform ${
									idx === karaokeIndex 
										? 'text-emerald-400 font-semibold text-lg scale-105 translate-x-2' 
										: 'text-zinc-400 opacity-60'
								}`}
							>
								{line.text || '\u00A0'}
							</div>
						))}
					</div>
				) : (
					<div className='whitespace-pre-wrap text-zinc-200 text-base leading-7 text-center'>
						{currentSong?.lyrics || "No lyrics available."}
					</div>
				)}
			</div>
		</div>
	);
};

export default KaraokeView;
