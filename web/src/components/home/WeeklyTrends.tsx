import { motion } from 'framer-motion';
import { Rocket, Anchor, TrendingUp, TrendingDown } from 'lucide-react';
import { PdlGainEntry } from '@/lib/api';
import { DDRAGON_VERSION } from '@/lib/constants';

interface WeeklyTrendsProps {
    trends: PdlGainEntry[];
}

export function WeeklyTrends({ trends }: WeeklyTrendsProps) {

    // Sort logic to ensure we get absolute best/worst
    const sorted = [...trends].sort((a, b) => b.pdlGain - a.pdlGain);
    const winners = sorted.filter(t => t.pdlGain > 0).slice(0, 2);
    // For losers, we want the MOST negative, so sort ascending
    const losers = sorted.filter(t => t.pdlGain < 0).sort((a, b) => a.pdlGain - b.pdlGain).slice(0, 2);

    // Removed early return to show empty state as requested
    // if (winners.length === 0 && losers.length === 0) return null;

    return (
        <section className="mb-20 grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* WINNERS BLOCK */}
            <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl blur-xl group-hover:bg-emerald-500/10 transition-colors duration-500" />
                <div className="relative bg-[#080c0a] border border-white/5 rounded-2xl p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/20">
                                <Rocket size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-[family-name:var(--font-outfit)] font-black text-white italic uppercase leading-none">
                                    Foguetes
                                </h3>
                                <p className="text-xs text-emerald-500/70 font-mono uppercase tracking-widest">
                                    Subindo sem freio
                                </p>
                            </div>
                        </div>
                        <TrendingUp className="text-emerald-500/20" size={40} />
                    </div>

                    <div className="space-y-3">
                        {winners.map((player, idx) => (
                            <TrendItem key={player.puuid} player={player} type="winner" index={idx} />
                        ))}
                        {winners.length === 0 && (
                            <div className="p-4 text-center text-gray-600 text-xs uppercase font-mono">
                                Ninguém subiu (ainda)
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* LOSERS BLOCK */}
            <div className="relative group">
                <div className="absolute inset-0 bg-red-500/5 rounded-2xl blur-xl group-hover:bg-red-500/10 transition-colors duration-500" />
                <div className="relative bg-[#0c0808] border border-white/5 rounded-2xl p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-lg text-red-500 border border-red-500/20">
                                <Anchor size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-[family-name:var(--font-outfit)] font-black text-white italic uppercase leading-none">
                                    Derreteu
                                </h3>
                                <p className="text-xs text-red-500/70 font-mono uppercase tracking-widest">
                                    Férias do ranking
                                </p>
                            </div>
                        </div>
                        <TrendingDown className="text-red-500/20" size={40} />
                    </div>

                    <div className="space-y-3">
                        {losers.map((player, idx) => (
                            <TrendItem key={player.puuid} player={player} type="loser" index={idx} />
                        ))}
                        {losers.length === 0 && (
                            <div className="p-4 text-center text-gray-600 text-xs uppercase font-mono">
                                Ninguém caiu (ainda)
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </section>
    );
}

function TrendItem({ player, type, index }: { player: PdlGainEntry, type: 'winner' | 'loser', index: number }) {
    const isWinner = type === 'winner';
    const colorClass = isWinner ? 'text-emerald-400' : 'text-red-400';
    const borderClass = isWinner ? 'group-hover:border-emerald-500/30' : 'group-hover:border-red-500/30';
    const bgClass = isWinner ? 'group-hover:bg-emerald-500/5' : 'group-hover:bg-red-500/5';

    return (
        <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`
                flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] 
                transition-all duration-300 ${borderClass} ${bgClass}
            `}
        >
            <div className={`
                flex flex-col items-center justify-center w-10 
                font-black text-xl italic leading-none
                ${isWinner ? 'text-emerald-600' : 'text-red-900'}
            `}>
                #{index + 1}
            </div>

            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                <img
                    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${player.profileIconId || 29}.png`}
                    alt={player.gameName}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white truncate text-sm">{player.gameName}</h4>
                    <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {player.tier}
                    </span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                    {isWinner ? 'Subindo como foguete' : 'Descendo de tobogã'}
                </div>
            </div>

            <div className="text-right">
                <div className={`text-lg font-black italic ${colorClass}`}>
                    {isWinner ? '+' : ''}{player.pdlGain}
                </div>
                <div className="text-[9px] text-gray-600 uppercase font-black tracking-widest">
                    PDL
                </div>
            </div>
        </motion.div>
    )
}
