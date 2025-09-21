import { Link } from "react-router-dom"
import { HomeIcon, Library, MessageCircle, Search, Music } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { SignedIn, useUser } from "@clerk/clerk-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import PlaylistSkeleton from "@/components/skeletons/PlaylistSkeleton"
import { useEffect } from "react"
import { useMusicStore } from "@/stores/useMusicStore"
import { useChatStore } from "@/stores/useChatStore"

const LeftSidebar = () => {
    const {albums,fetchAlbums, isLoading} = useMusicStore();
    const { initSocket, unreadMessages } = useChatStore();
    const { user } = useUser();
    
    // Calculate total unread messages directly from the Map
    const totalUnreadMessages = Array.from(unreadMessages.values()).reduce((total, count) => total + count, 0);

    useEffect(() => {
        fetchAlbums();
    }, [fetchAlbums]);

    // Initialize socket connection for real-time notifications
    useEffect(() => {
        if (user?.id) {
            initSocket(user.id);
        }
    }, [user?.id, initSocket]);

    // Force re-render when unread messages change
    useEffect(() => {
        // This effect will run whenever unreadMessages Map changes
    }, [unreadMessages]);



  return (
    <div className="h-full flex flex-col gap-2">
        {/* Navigation menu */}

        <div className="rounded-lg bg-black/40 backdrop-blur-sm p-4">
          <div className="space-y-2 overflow-hidden">
            <Link 
                to={"/"}
                className={cn(
                    buttonVariants({
                        variant: "ghost",
                        className: "w-full justify-start text-white hover:bg-zinc-800",
                    })
                )}
            >
                <HomeIcon className="mr-2 size-5" />
                <span className="hidden md:inline">Home</span>
            </Link>

            <Link 
                to={"/search"}
                className={cn(
                    buttonVariants({
                        variant: "ghost",
                        className: "w-full justify-start text-white hover:bg-zinc-800",
                    })
                )}
            >
                <Search className="mr-2 size-5" />
                <span className="hidden md:inline">Search</span>
            </Link>

            <Link 
                to={"/playlists"}
                className={cn(
                    buttonVariants({
                        variant: "ghost",
                        className: "w-full justify-start text-white hover:bg-zinc-800",
                    })
                )}
            >
                <Music className="mr-2 size-5" />
                <span className="hidden md:inline">PLaylists</span>
            </Link>

            <SignedIn>
                <Link 
                to={"/chat"}
                className="sidebar-notification-link text-white hover:bg-zinc-800"
            >
                <div className="relative mr-3 flex-shrink-0">
                    <MessageCircle className="size-5" />
                    {totalUnreadMessages > 0 && (
                        <div className="notification-badge">
                            {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                        </div>
                    )}
                </div>
                <span className="hidden md:inline flex-1 text-left">Message</span>
                {totalUnreadMessages > 0 && (
                    <div className="ml-auto bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold hidden md:flex flex-shrink-0 mr-1">
                        {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                    </div>
                )}
            </Link>
            </SignedIn>
          </div>
        </div>

        {/* Library section */}
        <div className="flex-1 rounded-lg bg-black/40 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-white px-2">
                    <Library className="mr-2 size-5" />
                    <span className="hidden md:inline">Albums</span>
                </div>
            </div>

            <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-2">
                    {isLoading ? (
                        <PlaylistSkeleton/>
                    ) : (
                        albums.map((album) => (
                            <Link 
                                to={`/albums/${album._id}`} 
                                key={album._id} 
                                className="p-2 hover:bg-zinc-800 rounded-md flex items-center gap-3 group cursor-pointer"
                            >
                                <img 
                                    src={album.imageUrl} 
                                    alt="Playlist img" 
                                    className="size-12 rounded-md flex-shrink-0 object-cover" 
                                />

                                <div className="flex-1 min-w-0 hidden md:block">
                                    <p className="font-medium truncate">{album.title}</p>
                                    <p className="text-sm text-zinc-400 truncate">Album . {album.artist}</p>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    </div>
  )
}

export default LeftSidebar
