import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Outlet } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import FriendsActivity from "./components/FriendsActivity";
import AudioPlayer from "./components/AudioPlayer";
import { PlaybackControls } from "./components/PlaybackControls";
import KaraokeView from "./components/KaraokeView";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useState, useRef } from "react";
import QueuePanel from "./components/QueuePanel";
import GenreClassifierComponent from "@/components/GenreClassifier";
import EmotionColorVisualizer from "@/components/EmotionColorVisualizer";
import AmbientLighting from "@/components/AmbientLighting";
import { useEmotionAnalysis } from "@/hooks/useEmotionAnalysis";


const MainLayout = () => {
	const [isMobile, setIsMobile] = useState(false);
	const { showKaraoke, showQueue, showGenreAnalysis, showEmotionColors, showAmbientLighting, showSignLanguage, ambientLightingSettings, isPlaying } = usePlayerStore();
	const { isAnalyzing, emotionResult, toggleAnalysis } = useEmotionAnalysis();
	const ambientCanvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	// Ambient lighting background effect
	useEffect(() => {
		if (isMobile || !showAmbientLighting || !ambientLightingSettings.enabled) {
			return;
		}

		if (!isPlaying) {
			return;
		}

		const canvas = ambientCanvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Set canvas size to window size with performance optimization
		const resizeCanvas = () => {
			const dpr = Math.min(window.devicePixelRatio, 1.5); // Cap DPR for performance
			canvas.width = window.innerWidth * dpr;
			canvas.height = window.innerHeight * dpr;
			canvas.style.width = window.innerWidth + 'px';
			canvas.style.height = window.innerHeight + 'px';
			ctx.scale(dpr, dpr);
		};
		resizeCanvas();
		
		// Debounce resize events
		let resizeTimeout: NodeJS.Timeout;
		const debouncedResize = () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(resizeCanvas, 100);
		};
		window.addEventListener('resize', debouncedResize);

		let animationId: number;
		let time = 0;

		let lastFrameTime = 0;
		const animate = (currentTime: number) => {
			// Throttle to 30fps for ambient lighting (smoother performance)
			if (currentTime - lastFrameTime < 33.33) {
				animationId = requestAnimationFrame(animate);
				return;
			}
			lastFrameTime = currentTime;

			time += 0.016 * ambientLightingSettings.speed;

			// Clear canvas efficiently
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Create ambient lighting effect based on emotion or default colors
			const defaultColors = {
				primary: '#FF0080',
				secondary: '#00FF80',
				accent: '#8000FF'
			};

			const colorPalette = emotionResult?.colorPalette || defaultColors;
			const primaryEmotion = emotionResult?.primaryEmotion || 'calm';
			const intensity = (emotionResult?.intensity || 0.6) * ambientLightingSettings.intensity;

			// Create multiple light sources with emotion-based colors based on room mode
			let lightSources;
			switch (ambientLightingSettings.roomMode) {
				case 'subtle':
					lightSources = [
						{ x: 0.2, y: 0.8, color: colorPalette.primary, size: 0.15 },
						{ x: 0.8, y: 0.8, color: colorPalette.secondary, size: 0.15 }
					];
					break;
				case 'party':
					lightSources = [
						{ x: 0.1, y: 0.1, color: colorPalette.primary, size: 0.4 },
						{ x: 0.9, y: 0.1, color: colorPalette.secondary, size: 0.4 },
						{ x: 0.1, y: 0.9, color: colorPalette.accent, size: 0.4 },
						{ x: 0.9, y: 0.9, color: colorPalette.primary, size: 0.4 },
						{ x: 0.5, y: 0.5, color: colorPalette.secondary, size: 0.5 },
						{ x: 0.3, y: 0.3, color: colorPalette.accent, size: 0.3 },
						{ x: 0.7, y: 0.7, color: colorPalette.primary, size: 0.3 }
					];
					break;
				case 'focus':
					lightSources = [
						{ x: 0.5, y: 0.5, color: colorPalette.primary, size: 0.2 }
					];
					break;
				default: // immersive
					lightSources = [
						{ x: 0.1, y: 0.1, color: colorPalette.primary, size: 0.3 },
						{ x: 0.9, y: 0.1, color: colorPalette.secondary, size: 0.25 },
						{ x: 0.1, y: 0.9, color: colorPalette.accent, size: 0.28 },
						{ x: 0.9, y: 0.9, color: colorPalette.primary, size: 0.22 },
						{ x: 0.5, y: 0.5, color: colorPalette.secondary, size: 0.35 }
					];
			}

			lightSources.forEach((source, index) => {
				const x = source.x * canvas.width;
				const y = source.y * canvas.height;
				const baseRadius = Math.min(canvas.width, canvas.height) * source.size;
				const radius = baseRadius + Math.sin(time * 2 + index) * 50;
				const alpha = intensity * 1.5 * (0.7 + Math.sin(time * 0.8 + index) * 0.3);

				const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
				gradient.addColorStop(0, hexToRgba(source.color, alpha));
				gradient.addColorStop(0.6, hexToRgba(source.color, alpha * 0.5));
				gradient.addColorStop(1, hexToRgba(source.color, 0));

				ctx.fillStyle = gradient;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			});

			// Add emotion-specific effects
			if (primaryEmotion === 'excitement' || primaryEmotion === 'joy') {
				// Add sparkle effects
				for (let i = 0; i < 8; i++) {
					const x = (Math.sin(time * 3 + i) * 0.4 + 0.5) * canvas.width;
					const y = (Math.cos(time * 2.5 + i) * 0.4 + 0.5) * canvas.height;
					const sparkleRadius = Math.sin(time * 4 + i) * 20 + 30;
					const sparkleAlpha = Math.sin(time * 3 + i) * 0.1 + 0.05;

					const sparkleGradient = ctx.createRadialGradient(x, y, 0, x, y, sparkleRadius);
					sparkleGradient.addColorStop(0, hexToRgba(colorPalette.accent, sparkleAlpha));
					sparkleGradient.addColorStop(1, 'transparent');

					ctx.fillStyle = sparkleGradient;
					ctx.fillRect(0, 0, canvas.width, canvas.height);
				}
			}

			animationId = requestAnimationFrame(animate);
		};

		animate(0);

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('resize', debouncedResize);
			clearTimeout(resizeTimeout);
		};
	}, [showAmbientLighting, emotionResult, isPlaying, ambientLightingSettings, isMobile]);

	const hexToRgba = (hex: string, alpha: number): string => {
		// Validate hex color
		if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
			return `rgba(38, 222, 129, ${Math.max(0, Math.min(1, alpha || 0))})`; // fallback green
		}

		// Remove # and ensure 6 characters
		const cleanHex = hex.slice(1);
		if (cleanHex.length !== 6) {
			return `rgba(38, 222, 129, ${Math.max(0, Math.min(1, alpha || 0))})`; // fallback green
		}

		const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
		const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
		const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
		const clampedAlpha = Math.max(0, Math.min(1, alpha || 0));

		return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
	};

	return (
		<div
			className='h-screen text-white flex flex-col bg-cover bg-center bg-no-repeat relative'
			style={{
				backgroundImage: 'url(/background.jpg)', // Replace with your desired background image URL
			}}
		>
			{/* Ambient Lighting Canvas - Full Screen Background */}
			{!isMobile && showAmbientLighting && ambientLightingSettings.enabled && (
				<canvas
					ref={ambientCanvasRef}
					className="fixed inset-0 w-full h-full pointer-events-none"
					style={{ mixBlendMode: 'screen', zIndex: 1 }}
				/>
			)}

			{/* Semi-transparent overlay for better text readability */}
			<div className='absolute inset-0 bg-black/5 pointer-events-none z-10'></div>

			<ResizablePanelGroup direction='horizontal' className='flex-1 flex h-full overflow-hidden p-2 relative z-20'>
				<AudioPlayer />
				{/* left sidebar */}
				<ResizablePanel defaultSize={20} minSize={isMobile ? 0 : 10} maxSize={30}>
					<LeftSidebar />
				</ResizablePanel>
				<ResizableHandle className='w-2 bg-black rounded-lg transition-colors' />

				{/* Main content */}
				<ResizablePanel defaultSize={isMobile ? 80 : 60}>
					<Outlet />
				</ResizablePanel>


				{!isMobile && (
					<>
						<ResizableHandle className='w-2 bg-black rounded-lg transition-colors' />

						{/* right sidebar */}
						<ResizablePanel defaultSize={20} minSize={0} maxSize={25} collapsedSize={0}>
							<div className='panel-animate h-full'>
								{showKaraoke ? (
									<KaraokeView />
								) : showQueue ? (
									<QueuePanel />
								) : showGenreAnalysis ? (
									<GenreClassifierComponent />
								) : showEmotionColors ? (
									<EmotionColorVisualizer
										isAnalyzing={isAnalyzing}
										emotionResult={emotionResult || undefined}
										onToggleAnalysis={toggleAnalysis}
										className="h-full"
									/>
								) : showAmbientLighting ? (
									<AmbientLighting className="h-full" />
								) : showSignLanguage ? (
									<div className="h-full bg-zinc-900 rounded-lg p-6 flex items-center justify-center">
										<div className="text-center">
											<div className="text-4xl mb-4">🤟</div>
											<h3 className="text-lg font-semibold text-white mb-2">Sign Language Feature</h3>
											<p className="text-gray-400 text-sm">Coming soon...</p>
										</div>
									</div>
								) : (
									<FriendsActivity />
								)}
							</div>
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>

			<div className='relative z-30'>
				<PlaybackControls />
			</div>
		</div>
	);
};
export default MainLayout;