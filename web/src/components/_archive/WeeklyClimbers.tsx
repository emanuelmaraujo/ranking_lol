import { motion } from 'framer-motion';
import { Rocket, TrendingUp, TrendingDown, ChevronUp, ChevronDown, Skull, Rewind } from 'lucide-react';
import { PdlGainEntry } from '@/lib/api';
import { useState } from 'react';
import { DDRAGON_VERSION } from '@/lib/constants';

interface WeeklyClimbersProps {
    trends: PdlGainEntry[];
}

export function WeeklyClimbers({ trends }: WeeklyClimbersProps) {
    const [tab, setTab] = useState<'winners' | 'losers'>('winners');

    // Top 3 Winners
    const climbers = trends
        .filter(t => t.pdlGain > 0)
        .sort((a, b) => b.pdlGain - a.pdlGain)
        .slice(0, 5); // Show top 5

    // Top 3 Losers (Foguete de Ré)
    const divers = trends
        .filter(t => t.pdlGain < 0)
        .sort((a, b) => a.pdlGain - b.pdlGain) // Sort by most negative (ascending)
        .slice(0, 5);

    return (
        <section className="col-span-12 xl:col-span-4 flex flex-col gap-6">

            {/* Header / Tabs */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-lg font-[family-name:var(--font-outfit)] font-black text-white uppercase italic leading-none flex items-center gap-2">
                        {tab === 'winners' ? <Rocket size={18} className="text-emerald-500" /> : <Rewind size={18} className="text-red-500" />}
                        {tab === 'winners' ? 'Foguetes' : 'Foguetes de Ré'}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">
                        {tab === 'winners' ? 'Subiram sem freio' : 'Caindo com estilo'}
                    </p>
                </div>

                {/* Simple Tab Switcher */}
                <div className="flex bg-white/5 rounded-lg p-1">
                    <button
                        onClick={() => setTab('winners')}
                        className={`p-2 rounded-md transition-all ${tab === 'winners' ? 'bg-emerald-500 text-black' : 'text-gray-500 hover:text-white'}`}
                    >
                        <TrendingUp size={16} />
                    </button>
                    <button
                        onClick={() => setTab('losers')}
                        className={`p-2 rounded-md transition-all ${tab === 'losers' ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        <TrendingDown size={16} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-3 min-h-[300px]">
                {(tab === 'winners' ? climbers : divers).length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-600 space-y-2">
                        <Skull className="w-8 h-8 opacity-50" />
                        <span className="text-xs uppercase tracking-widest font-bold">Ninguém aqui</span>
                    </div>
                )}

                {(tab === 'winners' ? climbers : divers).map((player, index) => (
                    <motion.div
                        key={player.puuid}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                            group relative flex items-center gap-3 p-3 rounded-xl border transition-all
                            ${tab === 'winners'
                                ? 'bg-[#0A0F0C] border-white/5 hover:border-emerald-500/30 hover:bg-emerald-900/5'
                                : 'bg-[#0F0A0A] border-white/5 hover:border-red-500/30 hover:bg-red-900/5'
                            }
                        `}
                    >
                        {/* Rank Badge */}
                        <div className={`
                            w-5 h-5 flex items-center justify-center rounded-sm text-[10px] font-black border
                            ${index === 0 ? (tab === 'winners' ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-red-600 text-white border-red-500') :
                                index === 1 ? 'bg-gray-800 text-gray-300 border-gray-700' :
                                    'bg-gray-900 text-gray-500 border-gray-800'}
                        `}>
                            {index + 1}
                        </div>

                        {/* Avatar */}
                        <div className="relative w-10 h-10 rounded-lg border border-white/10 overflow-hidden">
                            <img
                                src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${player.profileIconId || 29}.png`}
                                alt={player.gameName}
                                className={`w-full h-full object-cover ${tab === 'losers' ? 'grayscale group-hover:grayscale-0 transition-all' : ''}`}
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-[family-name:var(--font-outfit)] font-bold text-gray-200 truncate text-xs">{player.gameName}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                                <span>{player.tier} {player.rank}</span>
                            </div>
                        </div>

                        {/* PDL Gain/Loss */}
                        <div className="text-right">
                            <div className={`text-sm font-black flex items-center justify-end gap-1 ${tab === 'winners' ? 'text-emerald-400' : 'text-red-500'}`}>
                                {tab === 'winners' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                {Math.abs(player.pdlGain)}
                            </div>
                            <div className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">
                                PDL
                            </div>
                        </div>

                    </motion.div>
                ))}
            </div>
        </section>
    );
}
