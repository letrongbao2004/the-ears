import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlayerStore } from "@/stores/usePlayerStore";

const QueuePanel = () => {
    const { currentSong, queue, currentIndex, playedSongs } = usePlayerStore();

    const upcoming = queue.slice(Math.max(currentIndex + 1, 0));

    return (
        <div className='h-full bg-zinc-900 rounded-lg flex flex-col transition-colors'>
            <div className='p-4 border-b border-zinc-800'>
                <h2 className='font-semibold'>Queue</h2>
                <p className='text-xs text-zinc-400 mt-1'>See what’s playing next</p>
            </div>

            <ScrollArea className='flex-1'>
                <div className='p-4 space-y-6'>
                    <section>
                        <h3 className='text-sm text-zinc-400 mb-2'>Now playing</h3>
                        {currentSong ? (
                            <div className='flex items-center gap-3'>
                                <img src={currentSong.imageUrl} alt={currentSong.title} className='size-10 rounded object-cover' />
                                <div className='min-w-0'>
                                    <div className='text-white font-medium truncate'>{currentSong.title}</div>
                                    <div className='text-xs text-zinc-400 truncate'>{currentSong.artist}</div>
                                </div>
                                <div className='ml-auto flex items-end gap-0.5 h-4' aria-label='playing'>
                                    <span className='eq-bar'></span>
                                    <span className='eq-bar'></span>
                                    <span className='eq-bar'></span>
                                </div>
                            </div>
                        ) : (
                            <div className='text-zinc-500 text-sm'>Nothing playing</div>
                        )}
                    </section>

                    <hr className='border-zinc-800' />

                    <section>
                        <h3 className='text-sm text-zinc-400 mb-2'>Next in queue</h3>
                        <div className='space-y-1'>
                            {upcoming.length === 0 && <div className='text-zinc-500 text-sm'>Queue is empty</div>}
                            {upcoming.map((song, i) => (
                                <div key={`upcoming-${song._id}-${i}`} className='grid grid-cols-[20px_1fr] items-center gap-3 transition-all hover:bg-white/5 rounded px-2 py-1'>
                                    <div className='text-[11px] text-zinc-400 text-center'>{currentIndex + 1 + i + 1}</div>
                                    <div className='flex items-center gap-3'>
                                        <img src={song.imageUrl} alt={song.title} className='size-8 rounded object-cover' />
                                        <div className='min-w-0'>
                                            <div className='text-white text-sm truncate'>{song.title}</div>
                        						<div className='text-xs text-zinc-400 truncate'>{song.artist}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <hr className='border-zinc-800' />

                    <section>
                        <h3 className='text-sm text-zinc-400 mb-2'>Recently played</h3>
                        <div className='space-y-2'>
                            {(() => {
                                // Build unique history (latest first), excluding the current song
                                const seen = new Set<string>();
                                const uniq = [] as typeof playedSongs;
                                for (const s of [...playedSongs].reverse()) {
                                    if (currentSong && s._id === currentSong._id) continue;
                                    if (seen.has(s._id)) continue;
                                    seen.add(s._id);
                                    uniq.push(s);
                                    if (uniq.length >= 20) break;
                                }
                                if (uniq.length === 0) return <div className='text-zinc-500 text-sm'>No history yet</div>;
                                return uniq.map((song, index) => (
                                    <div key={`history-${song._id}-${index}`} className='grid grid-cols-[20px_1fr] items-center gap-3 transition-all hover:bg-white/5 rounded px-2 py-1'>
                                        <div className='text-[11px] text-zinc-400 text-center'>•</div>
                                        <div className='flex items-center gap-3'>
                                            <img src={song.imageUrl} alt={song.title} className='size-8 rounded object-cover' />
                                            <div className='min-w-0'>
                                                <div className='text-white text-sm truncate'>{song.title}</div>
                                                <div className='text-xs text-zinc-400 truncate'>{song.artist}</div>
                                            </div>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </section>
                </div>
            </ScrollArea>
        </div>
    );
};

export default QueuePanel;


