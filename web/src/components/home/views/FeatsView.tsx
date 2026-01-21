'use client';

import { motion } from 'framer-motion';
import { Trophy, Skull, Swords, Zap, Medal, Star, Flame, Crown, Eye, Shield, Hourglass, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getHallOfFame, HallOfFameData, UniqueFeat } from '@/lib/api';
import { getDateRange } from '@/lib/date-utils';
import { CHAMPION_SPLASH_BASE } from '@/lib/constants';
import { normalizeChampionName } from '@/lib/utils';

/* 
  FeatsView - "Galeria da Fama"
  Displays unique and rare events (Pentakills, Win Streaks, Stomps, etc.)
  Layout: Masonry-style Bento Grid using Tailwind columns.
*/

export function FeatsView({ period, queue }: { period: any, queue: any }) {
    const [data, setData] = useState<HallOfFameData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const range = getDateRange(period);
                const res = await getHallOfFame(queue, range ? { start: range.start, end: range.end } : undefined);
                setData(res);
            } catch (error) {
                console.error("Failed to fetch feats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [period, queue]);

    if (loading) return (
        <div className="w-full h-[60vh] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-yellow-500 border-t-white rounded-full animate-spin shadow-[0_0_30px_rgba(234,179,8,0.5)]" />
                <p className="text-yellow-600 font-bold tracking-[0.2em] uppercase text-xs">Caçando Mitos...</p>
            </div>
        </div>
    );

    const feats = data?.uniqueFeats || [];

    if (feats.length === 0) return (
        <div className="w-full h-[50vh] flex flex-col items-center justify-center text-zinc-600 gap-4">
            <Trophy className="w-16 h-16 opacity-20" />
            <div className="text-center">
                <h3 className="text-xl font-bold uppercase tracking-wider text-zinc-500">Nenhum Feito Lendário</h3>
                <p className="text-sm font-medium opacity-50">Ainda...</p>
            </div>
        </div>
    );

    // Grouping feats for better display? Or just a grid.
    // Let's go with a responsive grid.

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4 pb-24 font-[family-name:var(--font-outfit)]">

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        <Crown className="w-8 h-8 md:w-12 md:h-12 text-yellow-500 fill-yellow-500 animate-pulse" />
                        Galeria da Fama
                    </h2>
                    <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs md:text-sm mt-2 ml-1">
                        Momentos Raros & Lendários da Comunidade
                    </p>
                </div>
                <div className="hidden md:block">
                    <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                        <span className="text-yellow-500 font-bold text-xs uppercase tracking-widest">{feats.length} Feitos Registrados</span>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min">
                {feats.map((feat, idx) => (
                    <FeatCard key={`${feat.puuid}-${feat.matchId}-${idx}`} feat={feat} index={idx} />
                ))}
            </div>
        </div>
    );
}

function FeatCard({ feat, index }: { feat: UniqueFeat, index: number }) {
    // Config based on Type
    const config = getFeatConfig(feat.type);
    const champSplash = feat.championName ? `${CHAMPION_SPLASH_BASE}/${normalizeChampionName(feat.championName)}_0.jpg` : '';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className={`
                group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl
                ${config.bgClass} ${config.borderClass} ${config.spanClass || ''}
            `}
        >
            {/* Background Image (Champion) */}
            {champSplash && (
                <>
                    <div className="absolute inset-0 bg-cover bg-[position:center_20%] opacity-40 group-hover:opacity-60 transition-opacity duration-500 grayscale group-hover:grayscale-0"
                        style={{ backgroundImage: `url(${champSplash})` }}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-b ${config.gradientOverlay}`} />
                </>
            )}

            {/* Content */}
            <div className="relative z-10 p-5 flex flex-col h-full min-h-[200px] justify-between">

                {/* Top: Icon & Type */}
                <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-xl backdrop-blur-md border shadow-lg ${config.iconBg}`}>
                        <config.icon className={`w-6 h-6 ${config.iconColor}`} />
                    </div>
                    {feat.occurrences && feat.occurrences > 1 ? (
                        <div className="flex items-center justify-center bg-yellow-500 text-black w-8 h-8 rounded-full shadow-lg border-2 border-yellow-300 font-black text-sm relative z-20">
                            x{feat.occurrences}
                        </div>
                    ) : (
                        feat.matchId && (
                            <div className="text-[10px] font-mono text-white/40 bg-black/40 px-2 py-0.5 rounded uppercase">
                                Match
                            </div>
                        )
                    )}
                </div>


                {/* Middle: Player & Value */}
                <div className="mt-4">
                    <h4 className="text-white font-black text-2xl italic uppercase tracking-tighter drop-shadow-lg leading-none mb-1">
                        {config.label}
                    </h4>
                    <div className="flex items-center gap-2">
                        <img
                            src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${feat.profileIconId}.png`}
                            className="w-6 h-6 rounded-full border border-white/20"
                        />
                        <span className="text-white/80 font-bold text-sm truncate">{feat.gameName}</span>
                    </div>
                </div>

                {/* Bottom: Stat Value */}
                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-white/50 tracking-wider mb-0.5">
                            {config.valueLabel}
                        </p>
                        <p className={`text-xl font-black ${config.valueColor}`}>
                            {feat.value}
                        </p>
                    </div>
                    {feat.championName && (
                        <div className="flex items-center gap-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] uppercase font-bold text-white/50 tracking-wider mb-0.5">
                                    Campeão
                                </p>
                                <p className="text-xs font-bold text-zinc-300">
                                    {feat.championName}
                                </p>
                            </div>
                            <img
                                src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/champion/${normalizeChampionName(feat.championName)}.png`}
                                alt={feat.championName}
                                className="w-10 h-10 rounded-lg border border-white/20 shadow-md"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Hover Shine */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
        </motion.div >
    );
}

// Configuration Helper
function getFeatConfig(type: string) {
    switch (type) {
        case 'PENTA':
            return {
                label: 'Pentakill',
                icon: Trophy,
                spanClass: 'md:col-span-2 md:row-span-2',
                bgClass: 'bg-gradient-to-br from-yellow-900/40 via-red-900/40 to-yellow-900/40 animate-gradient-xy bg-[length:400%_400%]',
                borderClass: 'border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)] hover:shadow-[0_0_50px_rgba(234,179,8,0.4)] hover:border-yellow-400',
                iconBg: 'bg-yellow-500/20 border-yellow-500/50 p-3',
                iconColor: 'text-yellow-400 fill-yellow-400 w-8 h-8 md:w-10 md:h-10 animate-pulse',
                gradientOverlay: 'from-black/60 via-yellow-900/20 to-black/80',
                valueLabel: 'Abates Lendários',
                valueColor: 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 text-3xl md:text-5xl',
            };
        case 'QUADRA':
            return {
                label: 'Quadrakill',
                icon: Medal,
                spanClass: 'md:col-span-2',
                bgClass: 'bg-gradient-to-r from-orange-900/40 via-red-900/30 to-orange-900/40',
                borderClass: 'border-orange-500/60 shadow-[0_0_20px_rgba(249,115,22,0.15)] hover:border-orange-400',
                iconBg: 'bg-orange-500/20 border-orange-500/40',
                iconColor: 'text-orange-400 w-7 h-7',
                gradientOverlay: 'from-black/70 via-orange-900/20 to-black/80',
                valueLabel: 'Abates',
                valueColor: 'text-orange-400 text-2xl',
            };
        case 'PERFECT': // KDA Perfect (No deaths)
            return {
                label: 'Imortal',
                icon: Star,
                bgClass: 'bg-indigo-950',
                borderClass: 'border-indigo-500/40 hover:border-indigo-400',
                iconBg: 'bg-indigo-500/20 border-indigo-500/30',
                iconColor: 'text-indigo-400',
                gradientOverlay: 'from-black/80 via-indigo-950/80 to-black/90',
                valueLabel: 'KDA',
                valueColor: 'text-indigo-300',
            };
        case 'STOMP': // High CSPM or KDA or pure damage
            return {
                label: 'Espanco',
                icon: Skull,
                bgClass: 'bg-red-950',
                borderClass: 'border-red-500/40 hover:border-red-400',
                iconBg: 'bg-red-500/20 border-red-500/30',
                iconColor: 'text-red-400',
                gradientOverlay: 'from-black/80 via-red-950/80 to-black/90',
                valueLabel: 'Score',
                valueColor: 'text-red-400',
            };
        case 'WIN_STREAK':
            return {
                label: 'No Flow',
                icon: Flame,
                bgClass: 'bg-blue-950',
                borderClass: 'border-blue-500/40 hover:border-blue-400',
                iconBg: 'bg-blue-500/20 border-blue-500/30',
                iconColor: 'text-blue-400',
                gradientOverlay: 'from-black/80 via-blue-950/80 to-black/90',
                valueLabel: 'Vitórias Seguidas',
                valueColor: 'text-blue-400',
            };
        case 'COMEBACK':
            return {
                label: 'Reviravolta',
                icon: Zap,
                bgClass: 'bg-purple-950',
                borderClass: 'border-purple-500/40 hover:border-purple-400',
                iconBg: 'bg-purple-500/20 border-purple-500/30',
                iconColor: 'text-purple-400',
                gradientOverlay: 'from-black/80 via-purple-950/80 to-black/90',
                valueLabel: 'Dif. Ouro',
                valueColor: 'text-purple-300',
            };
        case 'SOLO_CARRY':
            return {
                label: '1v9',
                icon: Crown,
                bgClass: 'bg-violet-950',
                borderClass: 'border-violet-500/40 hover:border-violet-400',
                iconBg: 'bg-violet-500/20 border-violet-500/30',
                iconColor: 'text-violet-400',
                gradientOverlay: 'from-black/80 via-violet-950/80 to-black/90',
                valueLabel: 'Part. em Abates',
                valueColor: 'text-violet-300',
            };
        case 'BUTCHER':
            return {
                label: 'O Açougueiro',
                icon: Skull,
                bgClass: 'bg-rose-950',
                borderClass: 'border-rose-500/40 hover:border-rose-400',
                iconBg: 'bg-rose-500/20 border-rose-500/30',
                iconColor: 'text-rose-500',
                gradientOverlay: 'from-black/80 via-rose-950/80 to-black/90',
                valueLabel: 'Abates',
                valueColor: 'text-rose-400',
            };
        case 'VISIONARY':
            return {
                label: 'Map Hack',
                icon: Eye,
                bgClass: 'bg-teal-950',
                borderClass: 'border-teal-500/40 hover:border-teal-400',
                iconBg: 'bg-teal-500/20 border-teal-500/30',
                iconColor: 'text-teal-400',
                gradientOverlay: 'from-black/80 via-teal-950/80 to-black/90',
                valueLabel: 'Placar de Visão',
                valueColor: 'text-teal-300',
            };
        case 'TANK_GOD':
            return {
                label: 'A Muralha',
                icon: Shield,
                bgClass: 'bg-slate-900',
                borderClass: 'border-slate-500/40 hover:border-slate-400',
                iconBg: 'bg-slate-500/20 border-slate-500/30',
                iconColor: 'text-slate-400',
                gradientOverlay: 'from-black/80 via-slate-900/80 to-black/90',
                valueLabel: 'Dano Tankado',
                valueColor: 'text-slate-300',
            };
        case 'MARATHON':
            return {
                label: 'Maratona',
                icon: Hourglass,
                bgClass: 'bg-amber-950',
                borderClass: 'border-amber-500/40 hover:border-amber-400',
                iconBg: 'bg-amber-500/20 border-amber-500/30',
                iconColor: 'text-amber-400',
                gradientOverlay: 'from-black/80 via-amber-950/80 to-black/90',
                valueLabel: 'Duração',
                valueColor: 'text-amber-300',
            };
        case 'ABSURD_WINRATE':
            return {
                label: 'Winrate Absurdo',
                icon: Target,
                bgClass: 'bg-emerald-950',
                borderClass: 'border-emerald-500/40 hover:border-emerald-400',
                iconBg: 'bg-emerald-500/20 border-emerald-500/30',
                iconColor: 'text-emerald-400',
                gradientOverlay: 'from-black/80 via-emerald-950/80 to-black/90',
                valueLabel: 'Taxa de Vitória',
                valueColor: 'text-emerald-300',
            };

        default:
            return {
                label: 'Feito Raro',
                icon: Swords,
                bgClass: 'bg-zinc-900',
                borderClass: 'border-white/10',
                iconBg: 'bg-white/10 border-white/20',
                iconColor: 'text-white',
                gradientOverlay: 'from-black/80 to-black',
                valueLabel: 'Valor',
                valueColor: 'text-white',
            };
    }
}