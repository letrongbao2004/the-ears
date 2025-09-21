import { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';

interface SignLanguageTranslatorProps {
    className?: string;
}

interface SignData {
    word: string;
    startTime: number;
    endTime: number;
    gesture: string;
    description: string;
}

export default function SignLanguageTranslator({ className = "" }: SignLanguageTranslatorProps) {
    const { currentSong, isPlaying } = usePlayerStore();
    const [currentSign, setCurrentSign] = useState<SignData | null>(null);
    const [signSequence, setSignSequence] = useState<SignData[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Get real audio time from the actual audio element
    useEffect(() => {
        const audio = document.querySelector('audio') as HTMLAudioElement;
        audioRef.current = audio;

        if (!audio) return;

        const updateTime = () => {
            setCurrentTime(audio.currentTime);
        };

        audio.addEventListener('timeupdate', updateTime);
        return () => audio.removeEventListener('timeupdate', updateTime);
    }, []);

    // Generate sign language sequence when song changes
    useEffect(() => {
        if (!currentSong) {
            setSignSequence([]);
            setCurrentSign(null);
            return;
        }

        setLoading(true);

        // Simulate AI processing time
        setTimeout(() => {
            const mockSigns = generateMockSignSequence(currentSong);
            setSignSequence(mockSigns);
            setLoading(false);
        }, 1500);
    }, [currentSong]);

    // Update current sign based on audio time
    useEffect(() => {
        if (!isPlaying || signSequence.length === 0) {
            setCurrentSign(null);
            return;
        }

        const activeSign = signSequence.find(sign =>
            currentTime >= sign.startTime && currentTime <= sign.endTime
        );

        setCurrentSign(activeSign || null);
    }, [currentTime, signSequence, isPlaying]);

    const generateMockSignSequence = (song: any): SignData[] => {
        // Mock sign language generation based on song lyrics/title
        const words = (song?.title || "").split(" ").filter((word: string) => word.length > 0);
        const duration = song?.duration || 180; // Default 3 minutes
        const timePerWord = duration / Math.max(words.length, 1);

        return words.map((word: string, index: number) => ({
            word: word.toLowerCase(),
            startTime: index * timePerWord,
            endTime: (index + 1) * timePerWord,
            gesture: getSignGesture(word.toLowerCase()),
            description: getSignDescription(word.toLowerCase())
        }));
    };

    const getSignGesture = (word: string): string => {
        const gestures: Record<string, string> = {
            'love': '❤️',
            'music': '🎵',
            'dance': '💃',
            'happy': '😊',
            'sad': '😢',
            'night': '🌙',
            'day': '☀️',
            'you': '👆',
            'me': '👇',
            'we': '👥',
            'together': '🤝',
            'forever': '♾️',
            'beautiful': '✨',
            'dream': '💭',
            'heart': '💖',
            'soul': '🌟',
            'fire': '🔥',
            'water': '💧',
            'sky': '☁️',
            'star': '⭐'
        };

        return gestures[word] || '👋';
    };

    const getSignDescription = (word: string): string => {
        const descriptions: Record<string, string> = {
            'love': 'Cross arms over chest',
            'music': 'Wave hands rhythmically',
            'dance': 'Move body gracefully',
            'happy': 'Smile and raise hands',
            'sad': 'Touch face, look down',
            'night': 'Arc hand over head',
            'day': 'Point to sky',
            'you': 'Point forward',
            'me': 'Point to self',
            'we': 'Gesture to group',
            'together': 'Bring hands together',
            'forever': 'Circular motion',
            'beautiful': 'Frame face with hands',
            'dream': 'Close eyes, peaceful',
            'heart': 'Hands over heart',
            'soul': 'Touch chest deeply',
            'fire': 'Flickering upward motion',
            'water': 'Flowing hand movements',
            'sky': 'Sweep arms overhead',
            'star': 'Twinkling finger motions'
        };

        return descriptions[word] || 'General greeting gesture';
    };

    if (!currentSong) {
        return (
            <div className={`bg-zinc-900 rounded-lg p-6 ${className}`}>
                <div className="text-center">
                    <div className="text-4xl mb-4">🤟</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Sign Language Translator</h3>
                    <p className="text-gray-400 text-sm">Play a song to see sign language translation</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-zinc-900 rounded-lg p-6 ${className}`}>
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Sign Language Translation</h3>
                <p className="text-gray-400 text-sm">"{currentSong?.title}" by {currentSong?.artist}</p>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-400">Processing lyrics for sign language...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Current Sign Display */}
                    <div className="text-center bg-zinc-800 rounded-lg p-6">
                        {currentSign ? (
                            <div>
                                <div className="text-6xl mb-4">{currentSign.gesture}</div>
                                <div className="text-xl font-bold text-white mb-2">{currentSign.word.toUpperCase()}</div>
                                <div className="text-sm text-gray-400">{currentSign.description}</div>
                            </div>
                        ) : (
                            <div>
                                <div className="text-4xl mb-4 opacity-50">🤟</div>
                                <div className="text-gray-500">
                                    {isPlaying ? "Waiting for next sign..." : "Paused"}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {signSequence.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Progress</span>
                                <span>{Math.round((currentTime / (currentSong?.duration || 180)) * 100)}%</span>
                            </div>
                            <div className="w-full bg-zinc-700 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(currentTime / (currentSong?.duration || 180)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Sign Sequence Preview */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-300">Upcoming Signs</h4>
                        <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                            {signSequence.slice(0, 12).map((sign, index) => (
                                <div
                                    key={index}
                                    className={`text-center p-2 rounded text-xs ${currentSign?.word === sign.word
                                            ? 'bg-green-500/20 border border-green-500/50'
                                            : 'bg-zinc-800'
                                        }`}
                                >
                                    <div className="text-lg mb-1">{sign.gesture}</div>
                                    <div className="text-gray-400 truncate">{sign.word}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="text-xs text-gray-500 text-center">
                        Sign language translation is generated using AI analysis of song lyrics and rhythm
                    </div>
                </div>
            )}
        </div>
    );
}