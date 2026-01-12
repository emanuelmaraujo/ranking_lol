'use client';

import { motion } from 'framer-motion';
import { Skull, Crosshair, Target, Shield, Zap, Flame, Swords } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCommunityFeats } from '@/lib/api';
import { normalizeChampionName } from '@/lib/utils';
import { CHAMPION_SPLASH_BASE } from '@/lib/constants';

/* 
  FeatsView (Refined)
  Displays Cards for: 
  - Pentakills (Carousel)
  - Streaks (Imparável)
  - High Scores (Intankável)
  - Versatile (Multitarefa)
*/

export function FeatsView({ period, queue }: { period: any, queue: any }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeats = async () => {
            setLoading(true);
            try {
                const res = await getCommunityFeats(period, queue);
                setData(res);
            } catch (error) {
                console.error("Failed to fetch feats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFeats();
    }, [period, queue]);

    if (loading) return <div className="text-center p-10 animate-pulse text-yellow-500 font-bold tracking-widest">BUSCANDO LENDAS...</div>;
    if (!data) return null;

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } })
    };

    return (
        <div className="w-full max-w-[1500px] mx-auto p-4 pt-32 pb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">

            {/* 1. PENTAKILLS - The Star Show (Span 8) */}
            <motion.div
                custom={0} variants={cardVariants} initial="hidden" animate="visible"
                className="lg:col-span-8 relative overflow-hidden rounded-[2rem] border border-red-500/20 shadow-2xl group bg-black"
            >
                {/* Background Effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-900/40 via-black to-black opacity-80" />
                <div className="absolute inset-0 bg-[url('https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-challenger.png')] bg-no-repeat bg-right-bottom opacity-5 bg-contain pointer-events-none" />

                <div className="relative z-10 p-8 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-500/10 rounded-full border border-red-500/30">
                            <Swords className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase drop-shadow-[0_2px_10px_rgba(220,38,38,0.5)]">
                                Pentakill
                            </h2>
                            <p className="text-red-400/60 text-xs font-bold tracking-widest uppercase">Hall da Fama Sangrento</p>
                        </div>
                    </div>

                    {data.pentas.length > 0 ? (
                        <div className="flex-1 flex items-center overflow-x-auto snap-x snap-mandatory gap-6 no-scrollbar pb-4">
                            {data.pentas.map((penta: any, idx: number) => {
                                const splash = `${CHAMPION_SPLASH_BASE}/${normalizeChampionName(penta.champion)}_0.jpg`;
                                return (
                                    <motion.div
                                        key={`${penta.matchId}-${idx}`}
                                        className="snap-center shrink-0 w-[420px] h-[240px] relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl cursor-pointer group/card"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/card:scale-110" style={{ backgroundImage: `url(${splash})` }} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                                        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                                            <div className="flex justify-between items-end">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <img
                                                            src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${penta.player.profileIconId}.png`}
                                                            className="w-12 h-12 rounded-full border-2 border-red-500 shadow-xl"
                                                            alt="Player"
                                                        />
                                                        <div className="absolute -top-2 -right-2 bg-red-600 text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-lg border border-red-400">PENTA</div>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-white leading-none">{penta.player.gameName}</h3>
                                                        <p className="text-sm text-red-300 font-bold uppercase tracking-wide">{penta.champion}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-white/40 font-mono mb-1">{new Date(penta.date).toLocaleDateString()}</div>
                                                    <div className="inline-block px-2 py-1 rounded bg-white/10 backdrop-blur-md border border-white/5 text-[10px] font-bold text-red-200">
                                                        VER PARTIDA
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
                            <Skull className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-bold uppercase tracking-wider">Nenhum Maníaco Detectado</p>
                            <p className="text-sm opacity-50">O servidor está seguro... por enquanto.</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* 2. HIGH SCORE (Intankável) (Span 4) */}
            <motion.div
                custom={1} variants={cardVariants} initial="hidden" animate="visible"
                className="lg:col-span-4 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-zinc-900 to-black border border-yellow-500/20 p-8 flex flex-col"
            >
                <div className="absolute top-0 right-0 p-32 bg-yellow-500/5 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-yellow-500/10 rounded-full border border-yellow-500/30">
                            <Zap className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black italic text-white uppercase">O Intankável</h2>
                            <p className="text-yellow-500/60 text-xs font-bold tracking-widest uppercase">Maior Pontuação</p>
                        </div>
                    </div>

                    {data.highScores[0] ? (
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-5 mb-6">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)] rotate-3">
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${data.highScores[0].player.profileIconId}.png`} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-3 -right-3 bg-yellow-500 text-black text-xs font-black px-3 py-1 rounded-full shadow-lg">MVP</div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">{data.highScores[0].player.gameName}</h3>
                                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">
                                        {data.highScores[0].score.toFixed(1)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold">KDA</div>
                                    <div className="text-xl font-black text-white">{data.highScores[0].kda}</div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Dano %</div>
                                    <div className="text-xl font-black text-white">{(data.highScores[0].metrics?.dmgShare * 100).toFixed(0)}%</div>
                                </div>
                                <div className="col-span-2 bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Visão</span>
                                    <span className="text-lg font-black text-white">{data.highScores[0].metrics?.vision} pts</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-zinc-600">
                            Sem dados.
                        </div>
                    )}
                </div>
            </motion.div>

            {/* 3. STREAKS (O Imparável) (Span 4) */}
            <motion.div
                custom={2} variants={cardVariants} initial="hidden" animate="visible"
                className="lg:col-span-4 relative overflow-hidden rounded-[2rem] bg-zinc-900 border border-emerald-500/20 p-8 flex flex-col"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-2 bg-emerald-500/10 rounded-full border border-emerald-500/30">
                        <Flame className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black italic text-white uppercase">O Imparável</h2>
                        <p className="text-emerald-500/60 text-xs font-bold tracking-widest uppercase">Win Streak Atual</p>
                    </div>
                </div>

                {data.streaks[0] ? (
                    <div className="relative flex-1 flex flex-col items-center justify-center text-center z-10">
                        {/* Glowing Text Effect */}
                        <div className="relative">
                            <div className="text-[8rem] font-black text-emerald-950/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none blur-sm">
                                {data.streaks[0].streak}
                            </div>
                            <div className="text-7xl font-black text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.4)]">
                                {data.streaks[0].streak}x
                            </div>
                        </div>

                        <div className="mt-4 flex flex-col items-center">
                            <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${data.streaks[0].player.profileIconId}.png`} className="w-16 h-16 rounded-full border-4 border-emerald-500/30 mb-2" />
                            <h3 className="text-xl font-bold text-white">{data.streaks[0].player.gameName}</h3>
                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold mt-2">
                                +{data.streaks[0].lp} PDL Acumulados
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-600">
                        Ninguém consegue ganhar 3 seguidas? 🤡
                    </div>
                )}
            </motion.div>

            {/* 4. STATISTICS GRID (Span 8) */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Carniceiro */}
                <motion.div
                    custom={3} variants={cardVariants} initial="hidden" animate="visible"
                    className="group relative overflow-hidden rounded-[2rem] bg-zinc-900 border border-white/5 p-6 hover:border-red-500/40 transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Crosshair className="w-5 h-5 text-red-500" />
                                <span className="text-sm font-black text-zinc-400 uppercase tracking-widest group-hover:text-red-400 transition-colors">O Carniceiro</span>
                            </div>

                            {data.mostKills[0] ? (
                                <>
                                    <div className="text-5xl font-black text-white mb-1 group-hover:scale-105 transition-transform origin-left">{data.mostKills[0].kills}</div>
                                    <p className="text-zinc-500 text-sm font-medium">Abates Totais</p>

                                    <div className="flex items-center gap-3 mt-6">
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${data.mostKills[0].player.profileIconId}.png`} className="w-10 h-10 rounded-full grayscale group-hover:grayscale-0 transition-all" />
                                        <div>
                                            <div className="text-white font-bold text-sm">{data.mostKills[0].player.gameName}</div>
                                            <div className="text-red-400 text-[10px] font-bold">{data.mostKills[0].killsPerHour.toFixed(1)} Kills/Hora</div>
                                        </div>
                                    </div>
                                </>
                            ) : <span className="text-zinc-600">Sem dados</span>}
                        </div>
                        {data.mostKills[0] && (
                            <div className="w-32 h-32 absolute -right-6 -bottom-6 opacity-20 rotate-12 bg-red-500 rounded-full blur-[60px] group-hover:opacity-40 transition-opacity" />
                        )}
                    </div>
                </motion.div>

                {/* Farmville */}
                <motion.div
                    custom={4} variants={cardVariants} initial="hidden" animate="visible"
                    className="group relative overflow-hidden rounded-[2rem] bg-zinc-900 border border-white/5 p-6 hover:border-amber-500/40 transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-950/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-5 h-5 text-amber-500" />
                                <span className="text-sm font-black text-zinc-400 uppercase tracking-widest group-hover:text-amber-400 transition-colors">O Farmville</span>
                            </div>

                            {data.bestFarm[0] ? (
                                <>
                                    <div className="text-5xl font-black text-white mb-1 group-hover:scale-105 transition-transform origin-left">{data.bestFarm[0].csMin.toFixed(1)}</div>
                                    <p className="text-zinc-500 text-sm font-medium">CS por Minuto</p>

                                    <div className="flex items-center gap-3 mt-6">
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${data.bestFarm[0].player.profileIconId}.png`} className="w-10 h-10 rounded-full grayscale group-hover:grayscale-0 transition-all" />
                                        <div>
                                            <div className="text-white font-bold text-sm">{data.bestFarm[0].player.gameName}</div>
                                            <div className="text-amber-400 text-[10px] font-bold">{data.bestFarm[0].totalCs} Minions Mortos</div>
                                        </div>
                                    </div>
                                </>
                            ) : <span className="text-zinc-600">Sem dados</span>}
                        </div>
                        {data.bestFarm[0] && (
                            <div className="w-32 h-32 absolute -right-6 -bottom-6 opacity-20 rotate-12 bg-amber-500 rounded-full blur-[60px] group-hover:opacity-40 transition-opacity" />
                        )}
                    </div>
                </motion.div>

            </div>

        </div>
    );
}
