'use client';

import { motion } from 'framer-motion';
import { PeriodHighlights, HighlightPlayer } from '@/lib/api';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { TrendingUp, Swords, Timer, Crosshair } from 'lucide-react';
import Link from 'next/link';

interface SpotlightCarouselProps {
    highlights: PeriodHighlights | null;
    loading?: boolean;
}

export function SpotlightCarousel({ highlights, loading }: SpotlightCarouselProps) {
    if (loading || !highlights) return null;

    // Define items logic
    const items = [
        {
            id: 'rocket',
            label: 'Maior Ascensão',
            player: highlights.lpMachine,
            icon: TrendingUp,
            color: 'emerald',
            value: (p: HighlightPlayer) => `+${p.value} PDL`
        },
        {
            id: 'mvp',
            label: 'MVP da Semana',
            player: highlights.mvp,
            icon: Swords,
            color: 'amber',
            value: (p: HighlightPlayer) => `${p.value} Score`
        },
        {
            id: 'dominance',
            label: 'Stomper',
            player: highlights.stomper,
            icon: Timer,
            color: 'violet',
            value: (p: HighlightPlayer) => `${String(p.value).replace('.', ':')} min`
        },
        {
            id: 'lethal',
            label: 'Máquina de KDA',
            player: highlights.kdaKing,
            icon: Crosshair,
            color: 'rose',
            value: (p: HighlightPlayer) => `${p.value} KDA`
        }
    ].filter(item => item.player); // Filter out empty slots

    if (items.length === 0) return null;

    return (
        <section className="w-full py-10 overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-4 mb-8">
                <h2 className="text-2xl font-bold text-white tracking-tight">Destaques da Semana</h2>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="flex overflow-x-auto gap-6 px-4 md:px-[calc((100vw-1400px)/2+1rem)] pb-8 snap-x snap-mandatory scrollbar-hide">
                {items.map((item, idx) => (
                    <motion.div
                        key={item.id}
                        className="snap-center min-w-[300px] md:min-w-[350px]"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        viewport={{ once: true }}
                    >
                        <Link href={`/player/${item.player!.puuid}`}>
                            <div className={`group relative h-[220px] bg-[#121212] rounded-2xl p-6 border border-white/5 overflow-hidden transition-all hover:border-${item.color}-500/30 hover:shadow-2xl`}>
                                {/* Background Gradient */}
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-${item.color}-500/10 blur-[50px] rounded-full transition-opacity group-hover:bg-${item.color}-500/20`} />

                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-${item.color}-500/10 text-${item.color}-400`}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-xs font-bold uppercase tracking-wider text-${item.color}-400`}>
                                            {item.label}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 pt-2">
                                        <PlayerAvatar
                                            profileIconId={item.player!.profileIconId}
                                            className="ring-2 ring-black bg-black"
                                            size="lg"
                                        />
                                        <div>
                                            <div className="text-lg font-bold text-white leading-tight group-hover:text-emerald-400 transition-colors">
                                                {item.player!.gameName}
                                            </div>
                                            <div className="text-sm text-gray-500 font-mono">
                                                #{item.player!.tagLine}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-6 right-6 text-right">
                                        <div className={`text-3xl font-black text-white tracking-tighter`}>
                                            {item.value(item.player!)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
