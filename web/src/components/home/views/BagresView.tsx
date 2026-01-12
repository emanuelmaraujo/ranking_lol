'use client';

import { motion } from 'framer-motion';
import { TrendingDown, Timer, Ghost, Ban } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getHallOfShame } from '@/lib/api';

/* 
  BagresView (Refined)
  Displays:
  - O Derretido (Topper Loser)
  - O Mochileiro (Lowest Score)
  - O Peso Morto (Worst KDA)
  - O Inimigo do Farm (New)
*/

export function BagresView({ period, queue }: { period: any, queue: any }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBagres = async () => {
            setLoading(true);
            try {
                const res = await getHallOfShame(period, queue);
                setData(res);
            } catch (error) {
                console.error("Failed to fetch bagres", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBagres();
    }, [period, queue]);

    if (loading) return <div className="text-center p-10 animate-pulse text-red-800 font-bold tracking-widest font-mono">PROCURANDO CULPADOS...</div>;
    if (!data) return null;

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: (i: number) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.1, duration: 0.5 } })
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4 pt-32 pb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* 1. O DERRETIDO (Top Loser) - Span 2 */}
            <motion.div
                custom={0} variants={cardVariants} initial="hidden" animate="visible"
                className="lg:col-span-2 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-red-950 to-black border border-red-900/40 p-8 shadow-2xl group"
            >
                {/* Glitch Overlay Effect (Simulated) */}
                <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzM0MzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz/3o7qE1YN7aQSOeHcyY/giphy.gif')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-900/20 rounded-full border border-red-900/50">
                            <TrendingDown className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black italic text-red-500 uppercase tracking-tighter drop-shadow-md">O Derretido</h2>
                            <p className="text-red-800/80 text-xs font-bold tracking-widest uppercase">Mais PDL Perdido</p>
                        </div>
                    </div>

                    {data.topLoser ? (
                        <div className="flex items-center gap-6 mt-8">
                            <div className="relative">
                                <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${data.topLoser.profileIconId}.png`} className="w-24 h-24 rounded-full border-4 border-red-900 grayscale brightness-75 group-hover:grayscale-0 transition-all" />
                                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white group-hover:text-red-200 transition-colors">{data.topLoser.gameName}</h3>
                                <div className="text-4xl font-black text-red-600 mt-1">{data.topLoser.pdlLoss} <span className="text-sm text-red-900 font-bold uppercase">PDL Pro lixo</span></div>
                                <div className="mt-2 text-xs text-red-800 font-mono bg-red-950/30 px-2 py-1 rounded inline-block">
                                    Tilt Level: CRÍTICO ⚠️
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-zinc-600 mt-8 italic">Parece que ninguém tiltou essa semana... (Duvido)</div>
                    )}
                </div>
            </motion.div>

            {/* 2. O MOCHILEIRO (Lowest Score) */}
            <motion.div
                custom={1} variants={cardVariants} initial="hidden" animate="visible"
                className="relative overflow-hidden rounded-[2rem] bg-zinc-950 border border-zinc-800 p-6 flex flex-col group hover:border-zinc-700 transition-colors"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Ban className="w-5 h-5 text-zinc-600" />
                    <h2 className="text-xl font-black italic text-zinc-400 uppercase">O Mochileiro</h2>
                </div>

                {data.lowestScore ? (
                    <div className="flex flex-col items-center flex-1 justify-center">
                        <div className="relative mb-4">
                            <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${data.lowestScore.profileIconId}.png`} className="w-20 h-20 rounded-full border-2 border-zinc-700 grayscale opacity-70" />
                            <div className="absolute -bottom-2 -right-2 bg-zinc-800 text-zinc-400 text-xs font-bold px-2 py-1 rounded border border-zinc-700">Carregado</div>
                        </div>
                        <h3 className="text-lg font-bold text-zinc-300">{data.lowestScore.gameName}</h3>
                        <div className="text-3xl font-black text-zinc-600 mt-2">{data.lowestScore.score.toFixed(1)} <span className="text-xs font-normal">pts</span></div>
                        <p className="text-[10px] text-zinc-700 mt-2 max-w-[150px] text-center">Peso na coluna do time confirmada.</p>
                    </div>
                ) : <span className="text-zinc-700">Sem dados.</span>}
            </motion.div>


            {/* 3. O PESO MORTO (Worst KDA/Deaths) */}
            <motion.div
                custom={2} variants={cardVariants} initial="hidden" animate="visible"
                className="relative overflow-hidden rounded-[2rem] bg-zinc-950 border border-zinc-800 p-6 flex flex-col group hover:border-gray-700 transition-colors"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Ghost className="w-5 h-5 text-gray-500" />
                    <h2 className="text-xl font-black italic text-gray-400 uppercase">Peso Morto</h2>
                </div>

                {data.worstKda ? (
                    <div className="flex flex-col items-center flex-1 justify-center">
                        <div className="relative mb-4">
                            <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${data.worstKda.profileIconId}.png`} className="w-20 h-20 rounded-full border-2 border-gray-700 grayscale opacity-60" />
                            <Timer className="absolute -bottom-2 -right-2 w-6 h-6 text-gray-500 bg-black rounded-full" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-300">{data.worstKda.gameName}</h3>
                        <div className="text-3xl font-black text-gray-500 mt-2">{data.worstKda.deaths} <span className="text-xs font-normal">Mortes</span></div>
                        <div className="text-[10px] text-gray-600 mt-2 bg-gray-900 px-2 py-1 rounded">
                            ~{(data.worstKda.deaths * 35 / 60).toFixed(0)} min tela cinza
                        </div>
                    </div>
                ) : <span className="text-zinc-700">Sem dados.</span>}
            </motion.div>

            {/* 4. INIMIGO DO FARM (New) or PACIFISTA */}
            {/* We can use a generic "Shame Card" for whatever other metric we have */}

        </div>
    );
}
