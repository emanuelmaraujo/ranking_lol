import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { PdlGainEntry } from '@/lib/api';

interface TickerProps {
    trends: PdlGainEntry[];
}

export function Ticker({ trends }: TickerProps) {
    const [mount, setMount] = useState(false);

    // Auto-Scroll Logic
    const x = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        setMount(true);
    }, []);

    useEffect(() => {
        if (!mount || !trends || trends.length === 0) return;

        const scroll = () => {
            if (isPaused || !containerRef.current) return;

            x.current -= 1; // Speed: 1px per frame for fluidity

            // We render the list 3 times to ensure smooth loop
            // Calculate width of one set. 
            // This is an estimation or we can measure. 
            // For now, let's assume the render creates a long enough strip.
            // A better approach for exact loop is ensuring we have enough buffer.
            const contentWidth = containerRef.current.scrollWidth / 3;

            if (Math.abs(x.current) >= contentWidth) {
                x.current = 0;
            }

            containerRef.current.style.transform = `translate3d(${x.current}px, 0, 0)`;
            animationFrameId.current = requestAnimationFrame(scroll);
        };

        animationFrameId.current = requestAnimationFrame(scroll);

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [mount, trends, isPaused]);

    if (!trends || trends.length === 0) return null;

    // Filter significant trends
    const newsItems = trends
        .filter(t => Math.abs(t.pdlGain) >= 10)
        .slice(0, 20)
        .map(t => ({
            id: `${t.puuid}-${t.pdlGain}`,
            gameName: t.gameName,
            amount: Math.abs(t.pdlGain),
            isGain: t.pdlGain > 0,
            // Assuming queue type heuristics or default
            queue: (t as any).queueType === 'FLEX' ? 'FLEX' : 'SOLO'
        }));

    if (newsItems.length === 0) return null;

    // Triple duplication for safe looping
    const infiniteItems = [...newsItems, ...newsItems, ...newsItems];

    return (
        <div className="w-full bg-transparent py-2 overflow-hidden flex items-center relative z-50 h-12 mask-gradient-to-r select-none">
            {/* Live Badge */}
            <div className="absolute left-0 pl-2 md:pl-8 z-20 h-full flex items-center pr-8 bg-gradient-to-r from-[#050505] via-[#050505] to-transparent">
                <span className="flex items-center gap-1.5 text-emerald-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-black/40 rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)] backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Feed
                </span>
            </div>

            {/* Marquee Container */}
            <div
                className="flex-1 overflow-hidden relative h-full mask-gradient-to-r ml-24 md:ml-32"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div
                    ref={containerRef}
                    className="flex items-center gap-12 whitespace-nowrap active:cursor-grab pl-8"
                    style={{
                        width: 'max-content',
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                        transformStyle: 'preserve-3d',
                        perspective: 1000,
                        WebkitFontSmoothing: 'antialiased'
                    }}
                >
                    {infiniteItems.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="flex items-center gap-3 text-xs font-medium text-gray-400">
                            {/* Badge */}
                            <div className={`
                                px-1.5 py-0.5 rounded text-[9px] font-black uppercase border
                                ${item.queue === 'SOLO'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}
                            `}>
                                {item.queue}
                            </div>

                            {/* Name */}
                            <span className="text-white font-[family-name:var(--font-outfit)] font-bold tracking-wide">
                                {item.gameName}
                            </span>

                            {/* Value */}
                            <span className={`flex items-center gap-0.5 font-mono ${item.isGain ? 'text-emerald-400' : 'text-red-400'}`}>
                                {item.isGain ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {item.isGain ? '+' : '-'}{item.amount} PDL
                            </span>

                            {/* Separator */}
                            <span className="w-1 h-1 rounded-full bg-white/20 ml-2"></span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute right-0 w-32 h-full bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />
        </div>
    );
}
