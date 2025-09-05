import Topbar from "@/components/Topbar"
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMusicStore } from "@/stores/useMusicStore";
import { useEffect } from "react";
import FeaturedSection from "./components/FeaturedSection";
import SectionGrid from "./components/SectionGrid";
import { usePlayerStore } from "@/stores/usePlayerStore";

const HomePage = () => {

  const { 
    fetchmadeForYouSongs, 
    fetchTrendingSongs, 
    fetchFeaturedSongs, 
    isLoading, 
    madeForYouSongs, 
    trendingSongs, 
    featuredSongs 
  } = useMusicStore();

  const { initializeQueue } = usePlayerStore();

  useEffect(() => {
    fetchmadeForYouSongs();
    fetchTrendingSongs();
    fetchFeaturedSongs();
  }, [fetchmadeForYouSongs, fetchTrendingSongs, fetchFeaturedSongs]);

  useEffect(() => {
		if (madeForYouSongs.length > 0 && featuredSongs.length > 0 && trendingSongs.length > 0) {
			const allSongs = [...featuredSongs, ...madeForYouSongs, ...trendingSongs];
			initializeQueue(allSongs);
		}
	}, [initializeQueue, madeForYouSongs, trendingSongs, featuredSongs]);


  return (
    <main className="rounded-md overflow-hidden h-full bg-black/20 backdrop-blur-sm">
      <Topbar />
      <ScrollArea className='h-[calc(100vh-180px)]'>
				<div className='p-4 sm:p-6'>
					<h1 className='text-2xl sm:text-3xl font-bold mb-6'>Good afternoon</h1>
					<FeaturedSection />

					<div className='space-y-8'>
						<SectionGrid title='Made For You' songs={madeForYouSongs} isLoading={isLoading} />
						<SectionGrid title='Trending' songs={trendingSongs} isLoading={isLoading} />
					</div>
				</div>
			</ScrollArea>
    </main>
  )
}

export default HomePage
