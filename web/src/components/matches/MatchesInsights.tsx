'use client';

import { Activity, Flame, Hourglass, Swords, Target, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { InsightCard } from '../InsightCard'; // Assuming mapped at simple path or shared
// Note: If InsightCard is in web/src/components/InsightCard.tsx and this is web/src/components/matches/MatchesInsights.tsx, path is '../InsightCard'

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
    if (!data) return null;

    const cards = [
        {
            title: 'Viciado',
            icon: Activity,
            player: data.mostGames?.player,
            value: `${data.mostGames?.value || 0}`,
            subtext: 'Partidas Jogadas',
            twColor: 'orange'
        },
        {
            title: 'Mestre',
            icon: Target,
            player: data.bestWr?.player,
            value: data.bestWr ? `${data.bestWr.value.toFixed(0)}%` : '-',
            subtext: data.bestWr ? `Winrate (${data.bestWr.games} jogos)` : 'Sem dados',
            twColor: 'green'
        },
        {
            title: 'Tiltado',
            icon: Flame,
            player: data.worstWr?.player,
            value: data.worstWr ? `${data.worstWr.value.toFixed(0)}%` : '-',
            subtext: data.worstWr ? `Winrate (${data.worstWr.games} jogos)` : 'Sem dados',
            twColor: 'red'
        },
        {
            title: 'Dano Extremo',
            icon: Swords,
            player: data.highestDmg?.player,
            value: data.highestDmg ? `${(data.highestDmg.value / 1000).toFixed(1)}k` : '-',
            subtext: data.highestDmg ? `com ${data.highestDmg.champion}` : 'Sem dados',
            twColor: 'purple'
        },
        {
            title: 'Maratona',
            icon: Hourglass,
            player: data.longestGame?.player,
            value: data.longestGame ? `${(data.longestGame.value / 60).toFixed(0)}m` : '-',
            subtext: data.longestGame ? `com ${data.longestGame.champion}` : 'Sem dados',
            twColor: 'blue'
        }
    ];

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <Trophy className="w-5 h-5 text-purple-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Destaques Globais</h2>
                </div>

                <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                    {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => onPeriodChange(p)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${period === p
                                ? 'bg-zinc-800 text-white shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {p === 'DAILY' ? 'Dia' : p === 'WEEKLY' ? 'Semana' : 'Mês'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {cards.map((card, idx) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <InsightCard
                            title={card.title}
                            badge="Ranking"
                            icon={card.icon}
                            value={card.value}
                            subtext={card.subtext}
                            player={card.player}
                            twColor={card.twColor as any}
                        />
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
