import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Laptop2, ListMusic, Mic2, Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume1, Video, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseLRC } from "@/lib/utils";

type TimedLyricLine = { time: number; text: string };

const formatTime = (seconds: number) => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const PlaybackControls = () => {
	const { currentSong, isPlaying, togglePlay, playNext, playPrevious, showVideo, toggleVideo, showKaraoke, toggleKaraoke } = usePlayerStore();

	const [volume, setVolume] = useState(75);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [showLyrics, setShowLyrics] = useState(false);
	const [karaokeLines, setKaraokeLines] = useState<TimedLyricLine[]>([]);
	const [karaokeIndex, setKaraokeIndex] = useState(0);
	const [autoScroll, setAutoScroll] = useState(true);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

	// load persisted autoScroll preference
	useEffect(() => {
		try {
			const saved = localStorage.getItem("lyricsAutoScroll");
			if (saved !== null) setAutoScroll(saved === "true");
		} catch (error) {
			console.warn("Failed to read lyricsAutoScroll from localStorage", error);
		}
	}, []);

	// persist autoScroll preference when it changes
	useEffect(() => {
		try {
			localStorage.setItem("lyricsAutoScroll", String(autoScroll));
		} catch (error) {
			console.warn("Failed to write lyricsAutoScroll to localStorage", error);
		}
	}, [autoScroll]);

	useEffect(() => {
		audioRef.current = document.querySelector("audio");

		const audio = audioRef.current;
		if (!audio) return;

		const updateTime = () => {
			setCurrentTime(audio.currentTime);
			if (karaokeLines.length > 0) {
				let idx = karaokeIndex;
				while (idx + 1 < karaokeLines.length && karaokeLines[idx + 1].time <= audio.currentTime + 0.05) {
					idx++;
				}
				if (idx !== karaokeIndex) setKaraokeIndex(idx);
			}
		};
		const updateDuration = () => setDuration(audio.duration);

		audio.addEventListener("timeupdate", updateTime);
		audio.addEventListener("loadedmetadata", updateDuration);

		const handleEnded = () => {
			usePlayerStore.setState({ isPlaying: false });
		};

		audio.addEventListener("ended", handleEnded);

		return () => {
			audio.removeEventListener("timeupdate", updateTime);
			audio.removeEventListener("loadedmetadata", updateDuration);
			audio.removeEventListener("ended", handleEnded);
		};
	}, [currentSong, karaokeLines, karaokeIndex]);

	// parse karaoke lines when song lyrics change
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

	// auto scroll active line to center
	useEffect(() => {
		if ((!showLyrics && !showKaraoke) || !autoScroll) return;
		const container = lyricsContainerRef.current;
		if (!container) return;
		const children = container.children;
		const active = children[karaokeIndex] as HTMLElement | undefined;
		if (active && typeof active.scrollIntoView === 'function') {
			active.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}, [karaokeIndex, showLyrics, showKaraoke, autoScroll]);

	const handleSeek = (value: number[]) => {
		if (audioRef.current) {
			audioRef.current.currentTime = value[0];
			// Update karaoke index immediately when seeking
			if (karaokeLines.length > 0) {
				let idx = 0;
				for (let i = 0; i < karaokeLines.length; i++) {
					if (karaokeLines[i].time <= value[0] + 0.05) {
						idx = i;
					} else {
						break;
					}
				}
				setKaraokeIndex(idx);
			}
		}
	};

	return (
		<footer className='h-20 sm:h-24 bg-zinc-900 border-t border-zinc-800 px-4'>
			<div className='flex justify-between items-center h-full max-w-[1800px] mx-auto'>
				{/* currently playing song */}
				<div className='hidden sm:flex items-center gap-4 min-w-[180px] w-[30%]'>
					{currentSong && (
						<>
							<img
								src={currentSong.imageUrl}
								alt={currentSong.title}
								className='w-14 h-14 object-cover rounded-md'
							/>
							<div className='flex-1 min-w-0'>
								<div className='font-medium truncate hover:underline cursor-pointer'>
									{currentSong.title}
								</div>
								<div className='text-sm text-zinc-400 truncate hover:underline cursor-pointer'>
									{currentSong.artist}
								</div>
							</div>
						</>
					)}
				</div>

				{/* player controls*/}
				<div className='flex flex-col items-center gap-2 flex-1 max-w-full sm:max-w-[45%]'>
					<div className='flex items-center gap-4 sm:gap-6'>
						<Button
							size='icon'
							variant='ghost'
							className='hidden sm:inline-flex hover:text-white text-zinc-400'
						>
							<Shuffle className='h-4 w-4' />
						</Button>

						<Button
							size='icon'
							variant='ghost'
							className='hover:text-white text-zinc-400'
							onClick={playPrevious}
							disabled={!currentSong}
						>
							<SkipBack className='h-4 w-4' />
						</Button>

						<Button
							size='icon'
							className='bg-white hover:bg-white/80 text-black rounded-full h-8 w-8'
							onClick={togglePlay}
							disabled={!currentSong}
						>
							{isPlaying ? <Pause className='h-5 w-5' /> : <Play className='h-5 w-5' />}
						</Button>
						<Button
							size='icon'
							variant='ghost'
							className='hover:text-white text-zinc-400'
							onClick={playNext}
							disabled={!currentSong}
						>
							<SkipForward className='h-4 w-4' />
						</Button>
						<Button
							size='icon'
							variant='ghost'
							className='hidden sm:inline-flex hover:text-white text-zinc-400'
						>
							<Repeat className='h-4 w-4' />
						</Button>
					</div>

					<div className='hidden sm:flex items-center gap-2 w-full'>
						<div className='text-xs text-zinc-400'>{formatTime(currentTime)}</div>
						<Slider
							value={[currentTime]}
							max={duration || 100}
							step={1}
							className='w-full hover:cursor-grab active:cursor-grabbing'
							onValueChange={handleSeek}
						/>
						<div className='text-xs text-zinc-400'>{formatTime(duration)}</div>
					</div>
				</div>
				{/* volume controls */}
				<div className='hidden sm:flex items-center gap-4 min-w-[180px] w-[30%] justify-end'>
					{/* Lyrics Button */}
					{currentSong && (
						<>
							<Button
								size='icon'
								variant='ghost'
								className={`hover:text-white ${currentSong?.lyrics ? 'text-emerald-400' : 'text-zinc-400'}`}
								onClick={toggleKaraoke}
								title={currentSong?.lyrics ? 'Toggle Karaoke' : 'No lyrics available'}
								disabled={!currentSong?.lyrics}
							>
								<Mic2 className='h-4 w-4' />
							</Button>

							<Dialog open={showLyrics} onOpenChange={setShowLyrics}>
								<DialogContent className='bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-auto'>
									<DialogHeader>
										<div className='flex items-center justify-between'>
											<DialogTitle>Lyrics - {currentSong?.title}</DialogTitle>
											<Button
												variant='outline'
												size='sm'
												onClick={() => setAutoScroll((v) => !v)}
											>
												{autoScroll ? 'Auto-scroll: On' : 'Auto-scroll: Off'}
											</Button>
										</div>
									</DialogHeader>
									{karaokeLines.length > 0 ? (
										<div ref={lyricsContainerRef} className='text-zinc-200 text-lg leading-8 max-h-[60vh] overflow-auto pr-2'>
											{karaokeLines.map((line, idx) => (
												<div 
													key={idx} 
													className={`transition-all duration-500 ease-in-out transform ${
														idx === karaokeIndex 
															? 'text-emerald-400 font-bold text-xl scale-105 translate-x-2' 
															: 'text-zinc-400 opacity-70'
													}`}
												>
													{line.text || '\u00A0'}
												</div>
											))}
										</div>
									) : (
										<div className='whitespace-pre-wrap text-zinc-200 text-sm leading-6'>
											{currentSong?.lyrics || "No lyrics available."}
										</div>
									)}
								</DialogContent>
							</Dialog>
						</>
					)}
					
					<Button size='icon' variant='ghost' className='hover:text-white text-zinc-400'>
						<ListMusic className='h-4 w-4' />
					</Button>
					<Button size='icon' variant='ghost' className='hover:text-white text-zinc-400'>
						<Laptop2 className='h-4 w-4' />
					</Button>

					{/* Video Toggle Button */}
					{currentSong?.videoUrl && (
						<Button 
							size='icon' 
							variant='ghost' 
							className={`hover:text-white ${showVideo ? 'text-green-400' : 'text-zinc-400'}`}
							onClick={toggleVideo}
							title={showVideo ? 'Hide Video' : 'Show Video'}
						>
							{showVideo ? <VideoOff className='h-4 w-4' /> : <Video className='h-4 w-4' />}
						</Button>
					)}

					<div className='flex items-center gap-2'>
						<Button size='icon' variant='ghost' className='hover:text-white text-zinc-400'>
							<Volume1 className='h-4 w-4' />
						</Button>

						<Slider
							value={[volume]}
							max={100}
							step={1}
							className='w-24 hover:cursor-grab active:cursor-grabbing'
							onValueChange={(value) => {
								setVolume(value[0]);
								if (audioRef.current) {
									audioRef.current.volume = value[0] / 100;
								}
							}}
						/>
					</div>
				</div>
			</div>
		</footer>
	);
};