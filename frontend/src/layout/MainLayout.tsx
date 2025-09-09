import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Outlet } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import FriendsActivity from "./components/FriendsActivity";
import AudioPlayer from "./components/AudioPlayer";
import VideoPlayer from "./components/VideoPlayer";
import { PlaybackControls } from "./components/PlaybackControls";
import KaraokeView from "./components/KaraokeView";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useState } from "react";

const MainLayout = () => {
	const [isMobile, setIsMobile] = useState(false);
	const { showKaraoke } = usePlayerStore();

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	return (
		<div 
			className='h-screen text-white flex flex-col bg-cover bg-center bg-no-repeat relative'
			style={{
				backgroundImage: 'url(/background.jpg)',
			}}
		>
			{/* Semi-transparent overlay for better text readability */}
			<div className='absolute inset-0 bg-black/30 pointer-events-none'></div>
			
			<ResizablePanelGroup direction='horizontal' className='flex-1 flex h-full overflow-hidden p-2 relative z-10'>
				<AudioPlayer />
				<VideoPlayer />
				{/* left sidebar */}
				<ResizablePanel defaultSize={20} minSize={isMobile ? 0 : 10} maxSize={30}>
					<LeftSidebar />
				</ResizablePanel>

				<ResizableHandle className='w-2 bg-black rounded-lg transition-colors' />

				{/* Main content */}
				<ResizablePanel defaultSize={isMobile ? 80 : 60}>
					{showKaraoke ? <KaraokeView /> : <Outlet />}
				</ResizablePanel>

				{!isMobile && (
					<>
						<ResizableHandle className='w-2 bg-black rounded-lg transition-colors' />

						{/* right sidebar */}
						<ResizablePanel defaultSize={20} minSize={0} maxSize={25} collapsedSize={0}>
							<FriendsActivity />
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>

			<div className='relative z-10'>
				<PlaybackControls />
			</div>
		</div>
	);
};
export default MainLayout;