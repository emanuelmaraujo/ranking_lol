'use client';

import { motion } from 'framer-motion';
import { Rocket, Zap, Sword, Timer, Crown, Flame, Trophy, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getGlobalHighlights, getPdlGainRanking } from '@/lib/api';
import { getDateRange } from '@/lib/date-utils';
import { CHAMPION_SPLASH_BASE } from '@/lib/constants';
import { normalizeChampionName } from '@/lib/utils';

/* 
  HighlightsView 3.0 (Community Edition)
  - Tone: Brazilian LoL Slang (O Smurf, Speedrun, O Monstro).
  - Features: MVP (Avg Score), Speedrun (Fastest Game).
  - Design: Premium Glass, Center-Face Crop.
*/

export function HighlightsView({ period, queue }: { period: any, queue: any }) {
    const [highlights, setHighlights] = useState<any>(null);
    const [climbers, setClimbers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const range = getDateRange(period);
                const [hRes, cRes] = await Promise.all([
                    getGlobalHighlights(period, queue),
                    getPdlGainRanking(queue, 5, range?.start)
                ]);
                setHighlights(hRes);
                setClimbers(cRes);
            } catch (error) {
                console.error("Failed to fetch highlights", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [period, queue]);

    if (loading) return (
        <div className="w-full h-[600px] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-emerald-500 font-[family-name:var(--font-outfit)] font-bold tracking-[0.2em] uppercase text-sm">Buscando os Brabos...</p>
            </div>
        </div>
    );

    if (!highlights) return null;

    const champSplash = highlights.popularChamp ? `${CHAMPION_SPLASH_BASE}/${normalizeChampionName(highlights.popularChamp.name)}_0.jpg` : '';
    const champName = highlights.popularChamp?.name || '';
    // Dynamic Font Sizing
    const nameLen = champName.length;
    const titleSize = nameLen > 15 ? 'text-3xl md:text-5xl' : nameLen > 10 ? 'text-4xl md:text-6xl' : 'text-5xl md:text-7xl';

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4 pt-32 pb-24 font-[family-name:var(--font-outfit)]">

            {/* TOP SECTION: CHAMPION & PODIUM */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">

                {/* 1. CAMPEÃO DO MOMENTO (Hero - Span 5) */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
                    className="lg:col-span-12 xl:col-span-5 relative h-[500px] rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-black/50 border border-white/5"
                >
                    <div className="absolute inset-0 bg-zinc-950" />
                    {/* Image Fix: Cover + Center Top (No Extract Zoom) */}
                    <div className="absolute inset-0 bg-cover bg-[position:center_top] transition-transform duration-[30s] ease-in-out group-hover:scale-105 opacity-60"
                        style={{ backgroundImage: `url(${champSplash})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/10 to-transparent" />

                    <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                        <div className="mb-auto inline-flex items-center gap-2 bg-yellow-500/10 backdrop-blur-md border border-yellow-500/20 px-3 py-1.5 rounded-full self-start shadow-lg shadow-yellow-500/5">
                            <Crown className="w-3 h-3 text-yellow-500" />
                            <span className="text-yellow-200 font-bold uppercase tracking-widest text-[10px]">Pick do Momento</span>
                        </div>

                        <h2 className={`${titleSize} font-black text-white uppercase italic tracking-tighter mb-4 leading-[0.9] drop-shadow-xl`}>
                            {champName}
                        </h2>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#050505]/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 group-hover:border-white/20 transition-colors">
                                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Presença</p>
                                <p className="text-2xl font-black text-white">{highlights.popularChamp?.count || 0}</p>
                            </div>
                            <div className="bg-[#050505]/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 group-hover:border-white/20 transition-colors">
                                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Winrate</p>
                                <p className={`text-2xl font-black ${highlights.popularChamp?.winrate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {highlights.popularChamp?.winrate?.toFixed(0)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 2. PODIUM (Elegant Version - Span 7) */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
                    className="lg:col-span-12 xl:col-span-7 bg-[#09090b] rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden flex flex-col justify-between"
                >
                    {/* Background Glows */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

                    {/* Header */}
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Rocket className="w-5 h-5 text-indigo-500" />
                                <span className="text-indigo-400 font-bold text-xs uppercase tracking-[0.2em]">High Elo</span>
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">Os Foguetes</h2>
                        </div>
                    </div>

                    {/* Elegant Podium */}
                    <div className="flex-1 flex items-end justify-center gap-4 relative z-10 mt-8 pb-2">

                        {/* 2nd Place */}
                        <div className="flex flex-col items-center w-1/3 group relative top-8">
                            {climbers[1] ? (
                                <>
                                    <div className="relative mb-4 group-hover:-translate-y-2 transition-transform duration-500">
                                        <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-b from-zinc-300 to-zinc-500 shadow-lg shadow-zinc-500/20">
                                            <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${climbers[1].profileIconId}.png`} className="w-full h-full rounded-full border-2 border-[#09090b]" />
                                        </div>
                                        <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                                            <span className="bg-[#09090b] text-zinc-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-zinc-700 shadow-xl">#2</span>
                                        </div>
                                    </div>
                                    <h4 className="text-zinc-400 font-bold text-xs truncate max-w-[120px] mb-2">{climbers[1].gameName}</h4>
                                    <div className="flex flex-col items-center justify-center p-3 w-full bg-zinc-900/30 border border-white/5 rounded-2xl backdrop-blur-md">
                                        <span className="text-2xl font-black text-white">+{climbers[1].pdlGain}</span>
                                        <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">PDL</span>
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {/* 1st Place */}
                        <div className="flex flex-col items-center w-1/3 group relative -top-4">
                            {climbers[0] ? (
                                <>
                                    <div className="relative mb-6 group-hover:-translate-y-2 transition-transform duration-500">
                                        <div className="absolute -inset-6 bg-yellow-500/20 blur-xl rounded-full opacity-60 animate-pulse" />
                                        <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-800 shadow-2xl shadow-yellow-500/30 relative z-10">
                                            <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${climbers[0].profileIconId}.png`} className="w-full h-full rounded-full border-4 border-[#09090b]" />
                                        </div>
                                        <div className="absolute -top-5 inset-x-0 flex justify-center z-20">
                                            <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
                                        </div>
                                    </div>
                                    <h4 className="text-white font-black text-lg truncate max-w-[150px] mb-2">{climbers[0].gameName}</h4>
                                    <div className="flex flex-col items-center justify-center p-4 w-full bg-gradient-to-b from-yellow-950/20 to-yellow-900/5 border border-yellow-500/20 rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(234,179,8,0.05)]">
                                        <span className="text-4xl font-black text-yellow-400 drop-shadow-sm">+{climbers[0].pdlGain}</span>
                                        <span className="text-[10px] text-yellow-500/60 uppercase font-black tracking-widest">Gain do Dia</span>
                                    </div>
                                </>
                            ) : <div className="text-zinc-700 font-bold uppercase text-xs">Sem dados</div>}
                        </div>

                        {/* 3rd Place */}
                        <div className="flex flex-col items-center w-1/3 group relative top-12">
                            {climbers[2] ? (
                                <>
                                    <div className="relative mb-4 group-hover:-translate-y-2 transition-transform duration-500">
                                        <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-b from-orange-300 to-orange-700 opacity-80 shadow-lg shadow-orange-700/20">
                                            <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${climbers[2].profileIconId}.png`} className="w-full h-full rounded-full border-2 border-[#09090b]" />
                                        </div>
                                        <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                                            <span className="bg-[#09090b] text-orange-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-orange-900 shadow-xl">#3</span>
                                        </div>
                                    </div>
                                    <h4 className="text-zinc-500 font-bold text-xs truncate max-w-[100px] mb-2">{climbers[2].gameName}</h4>
                                    <div className="flex flex-col items-center justify-center p-3 w-full bg-zinc-900/30 border border-white/5 rounded-2xl backdrop-blur-md">
                                        <span className="text-xl font-black text-zinc-500">+{climbers[2].pdlGain}</span>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* LOWER GRID: 4 COLUMNS (MVP, WR, FASTEST, ASSISTS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* 1. O MVP (Avg Score) */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-[#09090b] rounded-[2rem] border border-white/5 p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors flex flex-col justify-between h-[220px]">
                    <div className="absolute top-0 right-0 p-20 bg-emerald-500/5 blur-[60px] group-hover:bg-emerald-500/10 transition-colors" />

                    <div>
                        <div className="inline-block p-2 bg-emerald-500/10 rounded-lg mb-3 border border-emerald-500/10">
                            <Star className="w-4 h-4 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">O Monstro</h3>
                        <p className="text-emerald-500/60 text-[10px] font-bold uppercase tracking-widest">Maior Nota Média</p>
                    </div>

                    {highlights.mvp ? (
                        <div>
                            <div className="text-5xl font-black text-white mb-2 tracking-tighter loading-none">{highlights.mvp.value.toFixed(1)}</div>
                            <div className="flex items-center gap-2">
                                <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${highlights.mvp.player.profileIconId}.png`} className="w-6 h-6 rounded-full border border-zinc-600" />
                                <span className="text-sm text-zinc-300 font-bold truncate">{highlights.mvp.player.gameName}</span>
                            </div>
                        </div>
                    ) : <span className="text-zinc-700 text-sm font-bold italic">Sem dados</span>}
                </motion.div>

                {/* 2. O SMURF (Winrate) */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="bg-[#09090b] rounded-[2rem] border border-white/5 p-6 relative overflow-hidden group hover:border-violet-500/30 transition-colors flex flex-col justify-between h-[220px]">
                    <div className="absolute top-0 right-0 p-20 bg-violet-500/5 blur-[60px] group-hover:bg-violet-500/10 transition-colors" />

                    <div>
                        <div className="inline-block p-2 bg-violet-500/10 rounded-lg mb-3 border border-violet-500/10">
                            <Zap className="w-4 h-4 text-violet-500" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">O Smurf</h3>
                        <p className="text-violet-500/60 text-[10px] font-bold uppercase tracking-widest">Maior Winrate</p>
                    </div>

                    {highlights.bestWr ? (
                        <div>
                            <div className="text-5xl font-black text-white mb-2 tracking-tighter loading-none">{highlights.bestWr.value.toFixed(0)}<span className="text-2xl text-violet-500">%</span></div>
                            <div className="flex items-center gap-2">
                                <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${highlights.bestWr.player.profileIconId}.png`} className="w-6 h-6 rounded-full border border-zinc-600" />
                                <span className="text-sm text-zinc-300 font-bold truncate">{highlights.bestWr.player.gameName}</span>
                            </div>
                        </div>
                    ) : <span className="text-zinc-700 text-sm font-bold italic">Sem dados</span>}
                </motion.div>

                {/* 3. SPEEDRUN (Shortest Game) */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-[#09090b] rounded-[2rem] border border-white/5 p-6 relative overflow-hidden group hover:border-yellow-500/30 transition-colors flex flex-col justify-between h-[220px]">
                    <div className="absolute top-0 right-0 p-20 bg-yellow-500/5 blur-[60px] group-hover:bg-yellow-500/10 transition-colors" />

                    <div>
                        <div className="inline-block p-2 bg-yellow-500/10 rounded-lg mb-3 border border-yellow-500/10">
                            <Timer className="w-4 h-4 text-yellow-500" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Speedrun</h3>
                        <p className="text-yellow-500/60 text-[10px] font-bold uppercase tracking-widest">Vitória Flash</p>
                    </div>

                    {highlights.shortestGame ? (
                        <div>
                            <div className="text-5xl font-black text-white mb-2 tracking-tighter loading-none">{(highlights.shortestGame.value / 60).toFixed(0)}<span className="text-2xl text-yellow-500">min</span></div>
                            <div className="flex items-center gap-2">
                                <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${highlights.shortestGame.player.profileIconId}.png`} className="w-6 h-6 rounded-full border border-zinc-600" />
                                <span className="text-sm text-zinc-300 font-bold truncate">{highlights.shortestGame.player.gameName}</span>
                            </div>
                        </div>
                    ) : <span className="text-zinc-700 text-sm font-bold italic">Sem dados</span>}
                </motion.div>

                {/* 4. O GARÇOM (Assists) - Replaces O COLOSSO */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="bg-[#09090b] rounded-[2rem] border border-white/5 p-6 relative overflow-hidden group hover:border-blue-500/30 transition-colors flex flex-col justify-between h-[220px]">
                    <div className="absolute top-0 right-0 p-20 bg-blue-500/5 blur-[60px] group-hover:bg-blue-500/10 transition-colors" />

                    <div>
                        <div className="inline-block p-2 bg-blue-500/10 rounded-lg mb-3 border border-blue-500/10">
                            {/* Reusing Sword Icon or getting a Hand icon? Let's use Sword for now or Target */}
                            <Trophy className="w-4 h-4 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">O Garçom</h3>
                        <p className="text-blue-500/60 text-[10px] font-bold uppercase tracking-widest">Mais Assistências</p>
                    </div>

                    {highlights.highestAssists ? (
                        <div>
                            <div className="text-5xl font-black text-white mb-2 tracking-tighter loading-none">{highlights.highestAssists.value}</div>
                            <div className="flex items-center gap-2">
                                <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${highlights.highestAssists.player.profileIconId}.png`} className="w-6 h-6 rounded-full border border-zinc-600" />
                                <span className="text-sm text-zinc-300 font-bold truncate">{highlights.highestAssists.player.gameName}</span>
                            </div>
                        </div>
                    ) : <span className="text-zinc-700 text-sm font-bold italic">Sem dados</span>}
                </motion.div>

            </div>
        </div>
    );
}
