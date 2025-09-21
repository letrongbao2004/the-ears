import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeft, Music, Users, Clock } from "lucide-react";
import Topbar from "@/components/Topbar";

const ProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useUser();
    const { users, fetchUsers, onlineUsers, userActivities } = useChatStore();
    const [profileUser, setProfileUser] = useState<any>(null);

    useEffect(() => {
        if (currentUser) fetchUsers();
    }, [fetchUsers, currentUser]);

    useEffect(() => {
        if (userId && users.length > 0) {
            const targetUser = users.find(u => u.clerkId === userId);
            setProfileUser(targetUser);
        }
    }, [userId, users]);

    const handleStartChat = () => {
        if (profileUser) {
            navigate(`/chat/${profileUser.clerkId}`);
        }
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    if (!profileUser) {
        return (
            <main className='h-full rounded-lg bg-gradient-to-b from-zinc-800 to-zinc-900 overflow-hidden'>
                <Topbar />
                <div className="flex items-center justify-center h-[calc(100vh-180px)]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading profile...</p>
                    </div>
                </div>
            </main>
        );
    }

    const isOnline = onlineUsers.has(profileUser.clerkId);
    const activity = userActivities.get(profileUser.clerkId);
    const isPlaying = activity && activity !== "Idle";

    return (
        <main className='h-full rounded-lg bg-gradient-to-b from-zinc-800 to-zinc-900 overflow-hidden'>
            <Topbar />
            
            <div className="p-6 h-[calc(100vh-180px)] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleGoBack}
                        className="text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold text-white">User Profile</h1>
                </div>

                {/* Profile Card */}
                <div className="bg-zinc-800/50 rounded-xl p-8 max-w-2xl mx-auto">
                    {/* Avatar and Basic Info */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="relative mb-4">
                            <Avatar className="size-24 border-4 border-zinc-700">
                                <AvatarImage src={profileUser.imageUrl} alt={profileUser.fullName} />
                                <AvatarFallback className="text-2xl">{profileUser.fullName[0]}</AvatarFallback>
                            </Avatar>
                            <div
                                className={`absolute bottom-2 right-2 h-6 w-6 rounded-full border-4 border-zinc-800 
                                    ${isOnline ? "bg-green-500" : "bg-zinc-500"}
                                `}
                            />
                        </div>
                        
                        <h2 className="text-3xl font-bold text-white mb-2">{profileUser.fullName}</h2>
                        
                        <div className="flex items-center gap-2 text-gray-400 mb-6">
                            <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-zinc-500"}`} />
                            <span>{isOnline ? "Online" : "Offline"}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <Button
                                onClick={handleStartChat}
                                className="bg-green-500 hover:bg-green-400 text-black font-medium px-6"
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Start Chat
                            </Button>
                        </div>
                    </div>

                    {/* Music Activity */}
                    <div className="space-y-6">
                        <div className="border-t border-zinc-700 pt-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Music className="h-5 w-5 text-green-500" />
                                Music Activity
                            </h3>
                            
                            {isPlaying ? (
                                <div className="bg-zinc-700/50 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                            <Music className="h-6 w-6 text-green-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-white font-medium">
                                                Currently listening to:
                                            </div>
                                            <div className="text-lg font-bold text-green-400">
                                                {activity.replace("Playing ", "").split(" by ")[0]}
                                            </div>
                                            <div className="text-gray-400">
                                                by {activity.split(" by ")[1]}
                                            </div>
                                        </div>
                                        <div className="flex space-x-1">
                                            <div className="w-1 h-4 bg-green-500 rounded animate-pulse"></div>
                                            <div className="w-1 h-6 bg-green-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-1 h-3 bg-green-500 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-zinc-700/30 rounded-lg p-4 text-center">
                                    <div className="text-gray-400 mb-2">
                                        <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        Not currently listening to music
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="border-t border-zinc-700 pt-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-500" />
                                Stats
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-700/30 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-white mb-1">
                                        {isOnline ? "Online" : "Offline"}
                                    </div>
                                    <div className="text-gray-400 text-sm">Status</div>
                                </div>
                                
                                <div className="bg-zinc-700/30 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-white mb-1">
                                        <Clock className="h-6 w-6 mx-auto" />
                                    </div>
                                    <div className="text-gray-400 text-sm">Member since</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ProfilePage;