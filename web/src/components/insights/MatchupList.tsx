"use client";

import { motion } from "framer-motion";
import { ChampionIcon } from "../ChampionIcon";
import { Swords, Skull, ShieldCheck } from "lucide-react";

interface MatchupListProps {
    matchups: {
        best: { name: string; games: number; wins: number; winRate: number }[];
        worst: { name: string; games: number; wins: number; winRate: number }[];
    };
}

export function MatchupList({ matchups }: MatchupListProps) {
    if (!matchups) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* BEST MATCHUPS (Vítimas) */}
            <div className="bg-black/20 rounded-2xl border border-white/5 p-6 backdrop-blur-sm relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <Swords size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white">Vítimas Favoritas</h4>
                        <p className="text-[10px] text-zinc-500 uppercase">Melhor Performance Contra</p>
                    </div>
                </div>

                <div className="space-y-3 relative z-10">
                    {matchups.best.length === 0 && <p className="text-zinc-500 text-xs italic">Sem dados suficientes.</p>}
                    {matchups.best.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/30 shadow-lg">
                                <ChampionIcon championName={m.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-sm font-bold text-zinc-200 truncate">{m.name}</span>
                                    <span className="text-xs font-mono font-bold text-emerald-400">{m.winRate}%</span>
                                </div>
                                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${m.winRate}%` }}
                                        className="h-full bg-emerald-500 rounded-full"
                                    />
                                </div>
                                <div className="text-[9px] text-zinc-500 mt-1 text-right">{m.games} jogos</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* WORST MATCHUPS (Nêmesis) */}
            <div className="bg-black/20 rounded-2xl border border-white/5 p-6 backdrop-blur-sm relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                        <Skull size={20} className="text-rose-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white">Nêmesis</h4>
                        <p className="text-[10px] text-zinc-500 uppercase">Pior Performance Contra</p>
                    </div>
                </div>

                <div className="space-y-3 relative z-10">
                    {matchups.worst.length === 0 && <p className="text-zinc-500 text-xs italic">Sem dados suficientes.</p>}
                    {matchups.worst.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-rose-500/30 shadow-lg">
                                <ChampionIcon championName={m.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-sm font-bold text-zinc-200 truncate">{m.name}</span>
                                    <span className="text-xs font-mono font-bold text-rose-400">{m.winRate}%</span>
                                </div>
                                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${m.winRate}%` }}
                                        className="h-full bg-rose-500 rounded-full"
                                    />
                                </div>
                                <div className="text-[9px] text-zinc-500 mt-1 text-right">{m.games} jogos</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
