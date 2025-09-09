import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { parseLRC } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type TimedLyricLine = { time: number; text: string };

const KaraokeView = () => {
	const { currentSong, showKaraoke, setShowKaraoke } = usePlayerStore();
	const [karaokeLines, setKaraokeLines] = useState<TimedLyricLine[]>([]);
	const [karaokeIndex, setKaraokeIndex] = useState(0);
	const [autoScroll, setAutoScroll] = useState(true);
	const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

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

	// Auto scroll active line to center
	useEffect(() => {
		if (!showKaraoke || !autoScroll) return;
		const container = lyricsContainerRef.current;
		if (!container) return;
		const children = container.children;
		const active = children[karaokeIndex] as HTMLElement | undefined;
		if (active && typeof active.scrollIntoView === 'function') {
			active.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}, [karaokeIndex, showKaraoke, autoScroll]);

	// Sync with audio time
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
			<div className='flex items-center justify-between p-6 border-b border-zinc-700'>
				<div className='text-center flex-1'>
					<h2 className='text-3xl font-bold text-white mb-2'>{currentSong.title}</h2>
					<p className='text-xl text-zinc-400'>{currentSong.artist}</p>
				</div>
				<div className='flex items-center gap-4'>
					<Button
						variant='outline'
						size='sm'
						onClick={() => setAutoScroll(!autoScroll)}
						className='text-white border-zinc-600'
					>
						{autoScroll ? 'Auto-scroll: On' : 'Auto-scroll: Off'}
					</Button>
					<Button
						variant='outline'
						size='sm'
						onClick={() => setShowKaraoke(false)}
						className='text-white border-zinc-600'
					>
						Close Karaoke
					</Button>
				</div>
			</div>
			
			{/* Karaoke Content */}
			<div className='flex-1 flex items-center justify-center p-8'>
				{karaokeLines.length > 0 ? (
					<div ref={lyricsContainerRef} className='text-zinc-200 text-3xl leading-12 max-h-full overflow-auto pr-4 text-center'>
						{karaokeLines.map((line, idx) => (
							<div 
								key={idx} 
								className={`transition-all duration-500 ease-in-out transform ${
									idx === karaokeIndex 
										? 'text-emerald-400 font-bold text-4xl scale-110 translate-x-4' 
										: 'text-zinc-400 opacity-60'
								}`}
							>
								{line.text || '\u00A0'}
							</div>
						))}
					</div>
				) : (
					<div className='whitespace-pre-wrap text-zinc-200 text-2xl leading-10 text-center'>
						{currentSong?.lyrics || "No lyrics available."}
					</div>
				)}
			</div>
		</div>
	);
};

export default KaraokeView;
