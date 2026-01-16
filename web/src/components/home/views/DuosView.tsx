'use client';

import { motion } from 'framer-motion';
import { Users, Heart, Zap, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCommunityDuos } from '@/lib/api';

/* 
  DuosView (Refined)
  Displays:
  - Casal 20 (Best Duo)
  - Bonde do Tigrinho (Best Squad)
  - More social stats
*/

export function DuosView({ period, queue }: { period: any, queue: any }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await getCommunityDuos(period, queue);
                setData(res);
            } catch (error) {
                console.error("Failed to fetch duos", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [period, queue]);

    if (loading) return <div className="text-center p-10 animate-pulse text-purple-500 font-bold tracking-widest">ANALISANDO SINERGIA...</div>;
    if (!data) return null;

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } })
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* 1. CASAL 20 (Best Duo) */}
            <motion.div
                custom={0} variants={cardVariants} initial="hidden" animate="visible"
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-pink-950 to-black border border-pink-500/20 shadow-2xl p-8 group"
            >
                <div className="absolute top-0 right-0 p-40 bg-pink-500/10 blur-[100px] rounded-full" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-pink-500/10 rounded-full border border-pink-500/30">
                            <Heart className="w-6 h-6 text-pink-500 fill-pink-500 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black italic text-white uppercase drop-shadow-md">Casal 20</h2>
                            <p className="text-pink-400/60 text-xs font-bold tracking-widest uppercase">A Dupla Imbatível</p>
                        </div>
                    </div>

                    {data.bestDuos && data.bestDuos[0] ? (
                        <div className="flex flex-col items-center">

                            {/* The Duo Visual */}
                            <div className="relative flex items-center justify-center -space-x-4 mb-6">
                                {/* Player 1 */}
                                <div className="relative z-10 group/p1">
                                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-r from-pink-500 to-purple-500 shadow-xl overflow-hidden">
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${data.bestDuos[0].p1.profileIconId}.png`} className="w-full h-full rounded-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center w-32 opacity-0 group-hover/p1:opacity-100 transition-opacity">
                                        <span className="text-sm font-bold text-white bg-black/80 px-2 py-1 rounded">{data.bestDuos[0].p1.gameName}</span>
                                    </div>
                                </div>

                                {/* Link Icon */}
                                <div className="z-20 w-10 h-10 rounded-full bg-black border-2 border-pink-500 flex items-center justify-center shadow-lg">
                                    <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                </div>

                                {/* Player 2 */}
                                <div className="relative z-10 group/p2">
                                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl overflow-hidden">
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${data.bestDuos[0].p2.profileIconId}.png`} className="w-full h-full rounded-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center w-32 opacity-0 group-hover/p2:opacity-100 transition-opacity">
                                        <span className="text-sm font-bold text-white bg-black/80 px-2 py-1 rounded">{data.bestDuos[0].p2.gameName}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 w-full max-w-md bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <div className="text-center">
                                    <div className="text-[10px] text-zinc-500 font-bold uppercase">Vitórias</div>
                                    <div className="text-2xl font-black text-green-400">{data.bestDuos[0].wins}</div>
                                </div>
                                <div className="text-center border-x border-white/10">
                                    <div className="text-[10px] text-zinc-500 font-bold uppercase">Winrate</div>
                                    <div className="text-2xl font-black text-pink-400">{((data.bestDuos[0].wins / data.bestDuos[0].games) * 100).toFixed(0)}%</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[10px] text-zinc-500 font-bold uppercase">Jogos</div>
                                    <div className="text-2xl font-black text-white">{data.bestDuos[0].games}</div>
                                </div>
                            </div>

                            <div className="mt-6 text-sm text-zinc-400 italic">
                                "{data.bestDuos[0].p1.gameName} & {data.bestDuos[0].p2.gameName}"
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-pink-500/10 rounded-3xl bg-pink-500/5">
                            <Heart className="w-12 h-12 mb-4 opacity-20 text-pink-500" />
                            <p className="font-bold uppercase tracking-wider">Sem Alma Gêmea</p>
                            <p className="text-sm opacity-50">Tá todo mundo jogando solo?</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* 2. BONDE DO TIGRINHO (Squads) */}
            <motion.div
                custom={1} variants={cardVariants} initial="hidden" animate="visible"
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet-950 to-black border border-violet-500/20 shadow-2xl p-8 group"
            >
                <div className="absolute top-0 left-0 p-40 bg-violet-500/10 blur-[100px] rounded-full" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-violet-500/10 rounded-full border border-violet-500/30">
                            <Crown className="w-6 h-6 text-violet-400 animate-bounce-slow" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black italic text-white uppercase drop-shadow-md">Bonde do Tigrinho</h2>
                            <p className="text-violet-400/60 text-xs font-bold tracking-widest uppercase">Squad Mais Ativo</p>
                        </div>
                    </div>

                    {data.bestSquads && data.bestSquads[0] ? (
                        <div className="flex flex-col items-center">
                            {/* Squad Visual */}
                            <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-[80%]">
                                {data.bestSquads[0].players.map((p: any, i: number) => (
                                    <div key={i} className="relative group/member">
                                        <img
                                            src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${p.profileIconId}.png`}
                                            className="w-14 h-14 rounded-full border-2 border-violet-500 shadow-lg hover:scale-110 transition-transform cursor-pointer"
                                        />
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/member:opacity-100 transition-opacity bg-black/90 text-[10px] text-white px-2 py-0.5 rounded whitespace-nowrap z-20">
                                            {p.gameName}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Stats */}
                            <div className="w-full bg-gradient-to-r from-violet-900/40 to-indigo-900/40 p-4 rounded-xl border border-white/10 flex justify-between items-center px-8">
                                <div>
                                    <div className="text-sm text-violet-300 font-bold uppercase">Sinergia</div>
                                    <div className="text-4xl font-black text-white">{data.bestSquads[0].winRate}%</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-violet-300 font-bold uppercase">Partidas</div>
                                    <div className="text-4xl font-black text-white">{data.bestSquads[0].games}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-violet-500/10 rounded-3xl bg-violet-500/5">
                            <Users className="w-12 h-12 mb-4 opacity-20 text-violet-500" />
                            <p className="font-bold uppercase tracking-wider">Sem Bonde Formado</p>
                            <p className="text-sm opacity-50">Flex tá morta?</p>
                        </div>
                    )}
                </div>
            </motion.div>

        </div>
    );
}
