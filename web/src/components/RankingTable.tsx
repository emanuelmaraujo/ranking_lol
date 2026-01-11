'use client';

import { RankingEntry } from '@/lib/api';
import { EloBadge } from './EloBadge';
import { PlayerAvatar } from './ui/PlayerAvatar';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Medal, Star, TrendingUp } from 'lucide-react';

export function RankingTable({ data }: { data: RankingEntry[] }) {
    if (data.length === 0) {
        return (
            <Card className="p-12 text-center text-gray-500">
                Nenhum jogador encontrado para esta fila.
            </Card>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <>
            {/* MOBILE CARD VIEW (< md) */}
            <div className="md:hidden space-y-4">
                {data.map((player) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ margin: "-20px" }}
                        key={player.puuid}
                    >
                        <Link href={`/player/${player.puuid}`}>
                            <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 active:scale-95 transition-transform">
                                <div className="flex items-center gap-4 mb-4">
                                    {/* Rank Badge */}
                                    <div className={`
                                        flex items-center justify-center w-10 h-10 rounded-xl font-black text-lg italic
                                        ${player.rank === 1 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-yellow-500/10' :
                                            player.rank === 2 ? 'bg-gray-300/10 text-gray-300 border border-gray-300/20' :
                                                player.rank === 3 ? 'bg-amber-600/10 text-amber-600 border border-amber-600/20' :
                                                    'bg-white/5 text-gray-500 border border-white/5'}
                                    `}>
                                        #{player.rank}
                                    </div>

                                    {/* Player */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <PlayerAvatar
                                            profileIconId={player.profileIconId}
                                            summonerLevel={player.summonerLevel}
                                            size="sm"
                                            className="border border-white/10"
                                        />
                                        <div className="min-w-0">
                                            <div className="font-bold text-white truncate text-lg leading-tight">
                                                {player.gameName}
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono">#{player.tagLine}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-2 bg-black/20 rounded-xl p-3 border border-white/5">
                                    <div className="flex flex-col items-center justify-center border-r border-white/5">
                                        <span className="text-[10px] uppercase text-gray-500 font-black tracking-widest mb-1">Elo</span>
                                        <div className="scale-75 origin-center">
                                            <EloBadge tier={player.tier} rank={player.rankDivision} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center border-r border-white/5">
                                        <span className="text-[10px] uppercase text-gray-500 font-black tracking-widest mb-1">Pontos</span>
                                        <div className="text-emerald-400 font-black text-lg">{player.totalScore.toFixed(0)}</div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center">
                                        <span className="text-[10px] uppercase text-gray-500 font-black tracking-widest mb-1">Winrate</span>
                                        <span className={`text-sm font-bold ${parseFloat(player.winRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                            {player.winRate}
                                        </span>
                                        <span className="text-[9px] text-gray-600">{player.gamesUsed} Jogos</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* DESKTOP TABLE VIEW (md+) */}
            <Card className="hidden md:block overflow-hidden border-0 bg-transparent p-0">
                {/* Existing Table Code Preserved exactly as is, just wrapped in hidden md:block */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-gray-400 text-xs font-semibold uppercase tracking-wider bg-black/20">
                                <th className="p-4 w-16 text-center">#</th>
                                <th className="p-4">Jogador</th>
                                <th className="p-4 text-center">Elo</th>
                                <th className="p-4 text-right">Pontos</th>
                                <th className="p-4 text-center">Winrate</th>
                                <th className="p-4 text-right hidden md:table-cell">Média</th>
                            </tr>
                        </thead>
                        <motion.tbody
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="divide-y divide-white/5"
                        >
                            {data.map((player) => (
                                <motion.tr
                                    key={player.puuid}
                                    variants={item}
                                    className="group hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    {/* Rank */}
                                    <td className="p-4 text-center font-bold text-lg">
                                        <div className="flex justify-center items-center">
                                            {player.rank === 1 && <Medal className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />}
                                            {player.rank === 2 && <Medal className="w-6 h-6 text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]" />}
                                            {player.rank === 3 && <Medal className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]" />}
                                            {player.rank > 3 && <span className="text-gray-500 group-hover:text-white transition-colors">{player.rank}</span>}
                                        </div>
                                    </td>

                                    {/* Player Info */}
                                    <td className="p-4">
                                        <Link href={`/player/${player.puuid}`} className="flex items-center gap-3">
                                            <PlayerAvatar
                                                profileIconId={player.profileIconId}
                                                summonerLevel={player.summonerLevel}
                                                size="sm"
                                                className="border border-white/10 group-hover:border-emerald-500/50 transition-all"
                                            />
                                            <div>
                                                <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                                                    {player.gameName}
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono">#{player.tagLine}</div>
                                            </div>
                                        </Link>
                                    </td>

                                    {/* Elo Badge + LP */}
                                    <td className="p-4 flex flex-col items-center justify-center">
                                        <EloBadge tier={player.tier} rank={player.rankDivision} />
                                        <span className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wider">
                                            {player.lp} PDL
                                        </span>
                                    </td>

                                    {/* Score */}
                                    <td className="p-4 text-right font-bold text-emerald-400 text-lg tabular-nums shadow-emerald-500/20 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                                        {player.totalScore.toFixed(0)}
                                    </td>

                                    {/* Winrate */}
                                    <td className="p-4 text-center">
                                        <div className="inline-flex items-center px-2 py-1 rounded bg-white/5 border border-white/5">
                                            <span className={`text-sm font-bold ${parseFloat(player.winRate) >= 50 ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {player.winRate}
                                            </span>
                                            <span className="text-xs text-gray-500 ml-2 border-l border-white/10 pl-2">
                                                {player.gamesUsed}J
                                            </span>
                                        </div>
                                    </td>

                                    {/* Avg Score */}
                                    <td className="p-4 text-right font-mono text-gray-400 hidden md:table-cell">
                                        {player.avgScore.toFixed(1)}
                                    </td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </table>
                </div>
            </Card>
        </>
    );
}
