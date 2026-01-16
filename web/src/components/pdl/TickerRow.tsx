"use client";

import { motion } from "framer-motion";
import { PdlGainEntry } from "@/lib/api";
import Link from "next/link";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { Trophy, Medal } from "lucide-react";
import { RankMigration } from "./RankMigration";
import { TrendArrow } from "./TrendArrow";
import CountUp from "react-countup";

interface TickerRowProps {
    player: PdlGainEntry;
    index: number;
}

// Tier Colors for Progress Bar
const TIER_BAR_COLORS: Record<string, string> = {
    CHALLENGER: 'bg-gradient-to-r from-yellow-300 to-yellow-100',
    GRANDMASTER: 'bg-gradient-to-r from-red-500 to-red-400',
    MASTER: 'bg-gradient-to-r from-purple-500 to-purple-400',
    DIAMOND: 'bg-blue-400',
    EMERALD: 'bg-emerald-500',
    PLATINUM: 'bg-cyan-400',
    GOLD: 'bg-yellow-500',
    SILVER: 'bg-[#9aa4af]',
    BRONZE: 'bg-[#8c513a]',
    IRON: 'bg-zinc-500',
};

export function TickerRow({ player, index }: TickerRowProps) {
    const isPositive = player.pdlGain > 0;
    const isNegative = player.pdlGain < 0;

    return (
        <motion.tr
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`border-b border-white/5 transition-all duration-300 group relative
                ${isPositive ? 'hover:bg-gradient-to-r hover:from-emerald-950/30 hover:to-transparent' :
                    isNegative ? 'hover:bg-gradient-to-r hover:from-red-950/30 hover:to-transparent' :
                        'hover:bg-white/5'}`}
        >
            {/* Rank */}
            {/* Rank */}
            <td className="p-4 text-center sticky left-0 bg-transparent">
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs shadow-lg ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    index === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
                        index === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' :
                            'bg-white/5 text-zinc-400'
                    }`}>
                    {index === 0 ? <Trophy size={14} /> :
                        index === 1 ? <Medal size={14} /> :
                            index === 2 ? <Medal size={14} /> :
                                index + 1}
                </div>
            </td>

            {/* Player (Ticker Symbol) */}
            <td className="p-4">
                <Link href={`/player/${player.puuid}`} className="flex items-center gap-3">
                    <PlayerAvatar profileIconId={player.profileIconId} size="sm" />
                    <div className="flex flex-col">
                        <span className="font-[family-name:var(--font-outfit)] font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-wider text-sm flex items-center gap-2">
                            {player.gameName}
                            {index < 3 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">#{player.tagLine}</span>
                    </div>
                </Link>
            </td>

            {/* Migration (Evolution) */}
            {/* Migration (Evolution) */}
            <td className="p-4">
                <div className="flex items-center gap-4">
                    {/* Start */}
                    <div className="flex flex-col items-center opacity-50 scale-90">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-bold text-zinc-500">
                                {player.startTier} {player.startRank}
                            </span>
                            <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1 rounded">
                                {player.startLp}
                            </span>
                        </div>
                    </div>

                    <div className="text-zinc-700">➜</div>

                    {/* End */}
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-mono font-bold transition-all duration-300 ${player.tier === 'CHALLENGER' ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.6)]' :
                                player.tier === 'GRANDMASTER' ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]' :
                                    player.tier === 'MASTER' ? 'text-purple-400 drop-shadow-[0_0_6px_rgba(192,132,252,0.4)]' :
                                        player.tier === 'DIAMOND' ? 'text-blue-400' :
                                            player.tier === 'EMERALD' ? 'text-emerald-400' :
                                                player.tier === 'PLATINUM' ? 'text-cyan-400' :
                                                    player.tier === 'GOLD' ? 'text-yellow-500' :
                                                        player.tier === 'SILVER' ? 'text-[#9aa4af]' :
                                                            player.tier === 'BRONZE' ? 'text-[#8c513a]' :
                                                                'text-white'
                                }`}>
                                {player.tier} {player.rank}
                            </span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1 border border-emerald-500/20 rounded">
                                {player.lp} PDL
                            </span>
                        </div>

                        {/* XP/LP Bar */}
                        <div className="w-full h-1 mt-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${['CHALLENGER', 'GRANDMASTER', 'MASTER'].includes(player.tier)
                                    ? `${TIER_BAR_COLORS[player.tier] || 'bg-emerald-500'} animate-pulse w-full`
                                    : TIER_BAR_COLORS[player.tier] || 'bg-emerald-500'
                                    }`}
                                style={{ width: ['CHALLENGER', 'GRANDMASTER', 'MASTER'].includes(player.tier) ? '100%' : `${Math.min(player.lp, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </td>

            {/* Gain (Price) */}
            <td className="p-4 text-right">
                <div className={`text-lg font-[family-name:var(--font-outfit)] font-bold tracking-tighter ${isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-zinc-400'
                    }`}>
                    {isPositive ? '+' : ''}
                    <CountUp end={player.pdlGain} duration={2} preserveValue />
                </div>
            </td>

            {/* Trend Indicator */}
            <td className="p-4 text-center">
                <div className="flex justify-center">
                    <div className={`p-2 rounded-full ${isPositive ? 'bg-emerald-500/10' : isNegative ? 'bg-red-500/10' : 'bg-white/5'
                        }`}>
                        <TrendArrow trend={player.trend} />
                    </div>
                </div>
            </td>
        </motion.tr>
    );
}
