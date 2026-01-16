"use client";

import { motion } from "framer-motion";
import { PdlGainEntry } from "@/lib/api";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { EloBadge } from "@/components/EloBadge";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import CountUp from "react-countup";

interface TheClimberProps {
    player: PdlGainEntry;
}

export function TheClimber({ player }: TheClimberProps) {
    const isPositive = player.pdlGain >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-3xl p-8 md:p-12 shadow-2xl group border-2 transition-all duration-500
                ${isPositive
                    ? "bg-gradient-to-br from-emerald-950/40 via-black to-black border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)] hover:border-emerald-500/50"
                    : "bg-gradient-to-br from-red-950/40 via-black to-black border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] hover:border-red-500/50"
                }`}
        >
            {/* Special Top 1 Glow Effect */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className={`absolute -top-20 -right-20 w-96 h-96 rounded-full blur-[100px] opacity-30 ${isPositive ? "bg-emerald-500" : "bg-red-500"}`} />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 p-2 text-center md:text-left">

                {/* 1. Identity (Left) */}
                <div className="flex flex-col md:flex-row items-center gap-6 shrink-0">
                    <div className="relative group">
                        {/* Avatar - No Border, just shadow */}
                        <div className="rounded-full shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-black p-1 relative z-10">
                            <PlayerAvatar profileIconId={player.profileIconId} size="lg" />
                        </div>
                        {/* Subtle glow behind */}
                        <div className={`absolute top-0 left-0 right-0 bottom-0 rounded-full blur-xl opacity-40 transition-opacity duration-500 ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`} />

                        {/* Rank Badge */}
                        <div className="absolute -bottom-2 -right-2 z-20">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#C8AA6E] text-black font-black text-xs shadow-lg border-2 border-black/50">
                                1
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:items-start items-center">
                        <div className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isPositive ? 'Maior Escalada' : 'Maior Queda'}
                        </div>
                        <Link href={`/player/${player.puuid}`} className="text-4xl md:text-5xl font-[family-name:var(--font-outfit)] font-black text-white hover:text-gray-200 transition-colors">
                            {player.gameName}
                        </Link>
                        <div className="text-zinc-500 font-mono text-sm tracking-widest mt-0.5">#{player.tagLine}</div>
                    </div>
                </div>

                {/* 2. Evolution (Center) - Simplified */}
                <div className="flex items-center gap-6 md:gap-12 flex-1 justify-center min-w-0 px-4">
                    {/* Start */}
                    <div className="flex flex-col items-center opacity-40 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                        <EloBadge tier={player.startTier || 'UNRANKED'} rank={player.startRank || ''} />
                        <span className="text-xs font-mono font-bold mt-2">{player.startLp} LP</span>
                    </div>

                    {/* Arrow */}
                    <motion.div
                        initial={{ opacity: 0.2 }}
                        animate={{ opacity: 1, x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-zinc-600"
                    >
                        <ArrowRight size={24} />
                    </motion.div>

                    {/* Current */}
                    <div className="flex flex-col items-center scale-110 drop-shadow-2xl">
                        <EloBadge tier={player.tier} rank={player.rank} />
                        <span className={`text-sm font-mono font-bold mt-2 ${isPositive ? 'text-white' : 'text-red-200'}`}>{player.lp} LP</span>
                    </div>
                </div>

                {/* 3. Stats (Right) */}
                <div className="flex flex-col items-center md:items-end shrink-0 md:pl-8 md:border-l border-white/5">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono uppercase tracking-widest mb-1">
                        {isPositive ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-red-400" />}
                        Saldo
                    </div>
                    <div className={`text-6xl md:text-7xl font-[family-name:var(--font-outfit)] font-black tracking-tighter leading-none ${isPositive ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}>
                        {isPositive ? "+" : ""}<CountUp end={player.pdlGain} duration={2.5} />
                    </div>
                </div>

            </div>
        </motion.div>
    );
}
