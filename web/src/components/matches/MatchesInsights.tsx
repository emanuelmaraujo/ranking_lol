'use client';

import { Trophy, Activity, Target, Flame, Hourglass, Swords } from 'lucide-react';
import { motion } from 'framer-motion';

export interface InsightData {
    period: string;
    queue: string;
    mostGames: { value: number, player: any };
    bestWr: { value: number, games: number, player: any } | null;
    worstWr: { value: number, games: number, player: any } | null;
    highestDmg: { value: number, champion: string, player: any, matchId: string } | null;
    longestGame: { value: number, champion: string, player: any, matchId: string } | null;
    popularChamp: { name: string, count: number } | null;
}

interface Props {
    data: InsightData | null;
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    onPeriodChange: (p: 'DAILY' | 'WEEKLY' | 'MONTHLY') => void;
}

export function MatchesInsights({ data, period, onPeriodChange }: Props) {
    const periods = [
        { id: 'DAILY', label: 'Dia' },
        { id: 'WEEKLY', label: 'Semana' },
        { id: 'MONTHLY', label: 'Mês' },
    ];

    if (!data) return null;

    const cards = [
        {
            title: 'Viciado',
            icon: Activity,
            player: data.mostGames?.player,
            value: `${data.mostGames?.value || 0}`,
            subtext: 'Partidas Jogadas',
            color: 'from-orange-500 to-red-500',
            borderColor: 'border-orange-500/20',
            textColor: 'text-orange-400'
        },
        {
            title: 'Mestre',
            icon: Target,
            player: data.bestWr?.player,
            value: data.bestWr ? `${data.bestWr.value.toFixed(0)}%` : '-',
            subtext: data.bestWr ? `Winrate (${data.bestWr.games} jogos)` : 'Sem dados',
            color: 'from-emerald-500 to-green-500',
            borderColor: 'border-emerald-500/20',
            textColor: 'text-emerald-400'
        },
        {
            title: 'Tiltado',
            icon: Flame,
            player: data.worstWr?.player,
            value: data.worstWr ? `${data.worstWr.value.toFixed(0)}%` : '-',
            subtext: data.worstWr ? `Winrate (${data.worstWr.games} jogos)` : 'Sem dados',
            color: 'from-zinc-500 to-slate-500',
            borderColor: 'border-zinc-500/20',
            textColor: 'text-zinc-400'
        },
        // Highest Damage
        {
            title: 'Dano Extremo',
            icon: Swords,
            player: data.highestDmg?.player,
            value: data.highestDmg ? `${(data.highestDmg.value / 1000).toFixed(1)}k` : '-',
            subtext: data.highestDmg ? `com ${data.highestDmg.champion}` : 'Sem dados',
            color: 'from-rose-500 to-pink-500',
            borderColor: 'border-rose-500/20',
            textColor: 'text-rose-400'
        },
        // Longest Game
        {
            title: 'Maratona',
            icon: Hourglass,
            player: data.longestGame?.player,
            value: data.longestGame ? `${(data.longestGame.value / 60).toFixed(0)}m` : '-',
            subtext: data.longestGame ? `com ${data.longestGame.champion}` : 'Sem dados',
            color: 'from-blue-500 to-indigo-500',
            borderColor: 'border-blue-500/20',
            textColor: 'text-blue-400'
        }
    ];

    return (
        <div className="space-y-6 mb-8">
            {/* Period Selector */}
            <div className="flex justify-center md:justify-start">
                <div className="bg-black/40 backdrop-blur-sm p-1 rounded-xl border border-white/5 inline-flex">
                    {periods.map(p => (
                        <button
                            key={p.id}
                            onClick={() => onPeriodChange(p.id as any)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${period === p.id
                                ? 'bg-white/10 text-white shadow-lg'
                                : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {cards.map((card, i) => (
                    <motion.div
                        key={`${period}-${i}`} // Force re-render on period change for animation
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`relative overflow-hidden rounded-2xl border ${card.borderColor} bg-[var(--color-surface)]/40 p-5 shadow-xl backdrop-blur-sm group`}
                    >
                        {/* Background Shader */}
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />

                        <div className="flex items-start justify-between relative z-10">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`p-2 rounded-lg bg-black/20 ${card.textColor}`}>
                                        <card.icon size={18} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{card.title}</span>
                                </div>

                                {card.player ? (
                                    <div>
                                        <div className="text-sm font-black text-white mb-1 truncate" title={card.player.gameName}>
                                            {card.player.gameName}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-xl font-bold ${card.textColor}`}>
                                                {card.value}
                                            </span>
                                            <span className="text-[10px] text-zinc-500 font-medium truncate">
                                                {card.subtext}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[60px] flex items-center text-zinc-600 text-xs font-medium">
                                        Sem dados suficientes
                                    </div>
                                )}
                            </div>

                            {card.player?.profileIconId && (
                                <img
                                    src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${card.player.profileIconId}.png`}
                                    alt=""
                                    className="w-10 h-10 rounded-full border-2 border-white/10 group-hover:scale-110 transition-transform shadow-lg ml-2"
                                />
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
