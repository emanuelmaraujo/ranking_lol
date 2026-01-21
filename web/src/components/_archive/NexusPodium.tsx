'use client';

import { motion } from 'framer-motion';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import Link from 'next/link';
import { RankingEntry } from '@/lib/api';
import { Crown, Trophy, Medal } from 'lucide-react';

interface NexusPodiumProps {
    top3: RankingEntry[];
    loading?: boolean;
}

export function NexusPodium({ top3, loading }: NexusPodiumProps) {
    if (loading) return <div className="h-[400px] w-full animate-pulse bg-white/5 rounded-xl" />;

    const [top1, top2, top3Player] = [top3[0], top3[1], top3[2]];

    const Pedestal = ({ player, rank, height, color, delay, icon: Icon }: { player?: RankingEntry, rank: number, height: string, color: string, delay: number, icon: any }) => (
        <motion.div
            className={`relative flex flex-col items-center justify-end ${rank === 1 ? 'z-20 -mx-4 scale-110' : 'z-10'}`}
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay }}
        >
            {/* Player Content */}
            <div className={`mb-4 flex flex-col items-center gap-2 ${rank === 1 ? 'mb-8' : ''}`}>
                {player ? (
                    <Link href={`/player/${player.puuid}`} className="group flex flex-col items-center">
                        <div className="relative">
                            <PlayerAvatar
                                profileIconId={player.profileIconId}
                                tier={player.tier}
                                size={rank === 1 ? 'xl' : 'xl'}
                                className={`ring-4 ${color} shadow-2xl transition-transform group-hover:scale-105 ${rank === 1 ? 'scale-[1.2]' : ''}`}
                            />
                            <div className={`absolute -top-6 left-1/2 -translate-x-1/2 ${rank === 1 ? 'animate-bounce' : ''}`}>
                                <Icon className={`w-8 h-8 ${color.replace('ring-', 'text-')} drop-shadow-lg`} fill="currentColor" />
                            </div>
                        </div>

                        <div className="text-center mt-3">
                            <h3 className={`font-[family-name:var(--font-outfit)] font-bold text-white truncate max-w-[120px] ${rank === 1 ? 'text-2xl' : 'text-lg'}`}>
                                {player.gameName}
                            </h3>
                            <p className={`font-mono ${color.replace('ring-', 'text-')} font-bold`}>
                                {player.lp} LP
                            </p>
                        </div>
                    </Link>
                ) : (
                    <div className="w-24 h-24 rounded-full bg-white/10 animate-pulse" />
                )}
            </div>

            {/* Pillars */}
            <div className={`w-32 md:w-40 ${height} rounded-t-lg bg-gradient-to-b from-[#1a1a1a] to-transparent border-t-4 ${color} relative overflow-hidden backdrop-blur-md`}>
                <div className={`absolute inset-0 bg-gradient-to-b ${color.replace('ring-', 'from-')}/20 to-transparent opacity-30`} />
                <div className="absolute inset-0 flex items-center justify-center text-6xl font-black text-white/5 select-none">
                    {rank}
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="relative w-full max-w-4xl mx-auto h-[500px] flex items-end justify-center px-4 pb-12">
            {/* Top 2 (Silver) */}
            <Pedestal
                player={top2}
                rank={2}
                height="h-48"
                color="ring-slate-400"
                delay={0.2}
                icon={Medal}
            />

            {/* Top 1 (Gold) */}
            <Pedestal
                player={top1}
                rank={1}
                height="h-64"
                color="ring-yellow-400"
                delay={0.4}
                icon={Crown}
            />

            {/* Top 3 (Bronze) */}
            <Pedestal
                player={top3Player}
                rank={3}
                height="h-36"
                color="ring-amber-700"
                delay={0.3}
                icon={Trophy}
            />
        </div>
    );
}
