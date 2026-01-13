'use client';

import { motion } from 'framer-motion';
import { TrendingDown, Timer, Ghost, Ban, AlertTriangle, EyeOff, Anchor, Skull, Truck, Crosshair } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getHallOfShame, getPdlGainRanking, getSeasonRanking } from '@/lib/api';
import { getDateRange } from '@/lib/date-utils';
import { InsightCard } from '@/components/InsightCard';
import { CHAMPION_SPLASH_BASE } from '@/lib/constants';
import { normalizeChampionName } from '@/lib/utils';

/* 
  BagresView 2.0 (Standardized)
  - Tone: Comedy/Shame.
  - Structure: Mirrors HighlightsView (Hero -> Grid -> Community).
*/

export function BagresView({ period, queue }: { period: any, queue: any }) {
    const [data, setData] = useState<any>(null);
    const [climbers, setClimbers] = useState<any[]>([]); // For PDL Losses
    const [ranking, setRanking] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBagres = async () => {
            setLoading(true);
            try {
                const range = getDateRange(period);
                const [hRes, pRes, rRes] = await Promise.all([
                    getHallOfShame(queue, range ? { start: range.start, end: range.end } : undefined),
                    getPdlGainRanking(queue, 50, range?.start), // Get more to find losers
                    getSeasonRanking(queue, 100, range ? { start: range.start, end: range.end } : undefined)
                ]);
                setData(hRes);
                setClimbers(pRes);
                setRanking(rRes);
            } catch (error) {
                console.error("Failed to fetch bagres", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBagres();
    }, [period, queue]);

    if (loading) return (
        <div className="w-full h-[600px] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-red-900 border-t-red-500 rounded-full animate-spin" />
                <p className="text-red-800 font-[family-name:var(--font-outfit)] font-bold tracking-[0.2em] uppercase text-sm">Investigando Crimes...</p>
            </div>
        </div>
    );

    if (!data) return null;

    // --- LOGIC ---

    // 1. HERO: O Derretido (Max PDL Loss)
    // Sort climbers by pdlGain ascending
    const losers = climbers.filter(c => c.pdlGain < 0).sort((a, b) => a.pdlGain - b.pdlGain);
    const topLoser = losers.length > 0 ? losers[0] : null;

    // 2. HERO: A Carroça (Worst Champ)
    const worstChamp = data.aCarroca;
    const champSplash = worstChamp ? `${CHAMPION_SPLASH_BASE}/${normalizeChampionName(worstChamp.championName)}_0.jpg` : '';

    // 2. LOWER GRID CALCULATIONS (From Ranking)
    // Lowest Score
    const lowestScorePlayer = ranking.filter(r => r.gamesUsed > 0).sort((a, b) => a.avgScore - b.avgScore)[0] || null;

    // Lowest Winrate (Min 5 games)
    const worstWrPlayer = ranking.filter(r => r.gamesUsed >= 5).sort((a, b) => parseFloat(a.winRate) - parseFloat(b.winRate))[0];

    // 3. COMMUNITY STORIES (From HallOfShame Data)
    const getStories = () => {
        const list: any[] = [];

        // Cego (Vision)
        if (data.cego) {
            list.push({
                icon: EyeOff,
                title: 'O Cego',
                subtitle: 'Mapa Apagado',
                player: data.cego,
                value: data.cego.value,
                unit: 'Vis/min',
                twColor: 'zinc'
            });
        }

        // Ilusionista (KP)
        if (data.ilusionista) {
            list.push({
                icon: Ghost,
                title: 'O Ilusionista',
                subtitle: 'Mágico do Sumiço',
                player: data.ilusionista,
                value: data.ilusionista.value,
                twColor: 'zinc'
            });
        }

        // Soneca Baron (No Objectives)
        if (data.sonecaBaron) {
            list.push({
                icon: Timer,
                title: 'Soneca',
                subtitle: '0 Objetivos',
                player: data.sonecaBaron,
                value: 'ZZZ',
                twColor: 'amber'
            });
        }

        // Mata Fofo (Ks)
        if (data.mataFofo) {
            list.push({
                icon: Crosshair,
                title: 'Zé Kills',
                subtitle: 'KDA Player',
                player: data.mataFofo,
                value: data.mataFofo.value,
                unit: 'Kills',
                twColor: 'red'
            });
        }

        // iFood (Feeder)
        if (data.ifood) {
            list.push({
                icon: Truck,
                title: 'iFood',
                subtitle: 'Entrega Rápida',
                player: data.ifood,
                value: data.ifood.value, // "X Mortes"
                twColor: 'red'
            });
        }

        // O Finado (Max Deaths)
        if (data.finado) {
            list.push({
                icon: Skull,
                title: 'O Finado',
                subtitle: 'Simulador de Velório',
                player: data.finado,
                value: data.finado.value,
                twColor: 'red'
            });
        }

        // Tela Preta (Dead Time)
        if (data.telaPreta) {
            list.push({
                icon: Ghost,
                title: 'Tela Cinza',
                subtitle: 'Simulador de Espectador',
                player: data.telaPreta,
                value: data.telaPreta.value, // % Time Dead
                twColor: 'red'
            });
        }

        return list;
    };

    const stories = getStories();

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4 pt-32 pb-24 font-[family-name:var(--font-outfit)]">

            {/* HERO SECTION: SPLIT HERO */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">

                {/* 1. O DERRETIDO (Top Loser) - Span 7 */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
                    className="lg:col-span-12 xl:col-span-7 relative h-[400px] rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-red-900/20 border border-red-900/40 bg-gradient-to-br from-red-950 to-black"
                >
                    {/* Background Glitch */}
                    <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzM0MzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz/3o7qE1YN7aQSOeHcyY/giphy.gif')] opacity-[0.05] mix-blend-overlay pointer-events-none" />

                    <div className="absolute inset-0 p-8 flex flex-col justify-center items-center z-10 text-center">
                        <div className="flex items-center gap-2 mb-4 bg-red-900/30 px-4 py-1 rounded-full border border-red-500/20">
                            <TrendingDown className="w-5 h-5 text-red-500" />
                            <span className="text-red-400 font-bold uppercase tracking-widest text-xs">Desastre da Semana</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-2 text-shadow-lg shadow-red-900">
                            O Derretido
                        </h2>

                        {topLoser ? (
                            <div className="flex flex-col items-center mt-6">
                                <div className="relative mb-6 group-hover:shake">
                                    <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-b from-red-500 to-black shadow-2xl shadow-red-900/50">
                                        <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${topLoser.profileIconId}.png`} className="w-full h-full rounded-full border-4 border-[#09090b] grayscale brightness-75 transition-all group-hover:grayscale-0" />
                                    </div>
                                    <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                                        <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full border border-red-900 shadow-xl tracking-widest">TILTADO</span>
                                    </div>
                                </div>
                                <h3 className="text-3xl font-black text-red-200">{topLoser.gameName}</h3>
                                <div className="flex items-center gap-2 mt-2 bg-red-950/50 px-4 py-2 rounded-2xl border border-red-900/50">
                                    <span className="text-4xl font-black text-red-600">{topLoser.pdlGain}</span>
                                    <span className="text-xs text-red-400 font-bold uppercase tracking-widest text-left leading-tight">PDL<br />Pro Lixo</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-zinc-500 italic mt-4">Nenhum bagre detectado (ainda).</p>
                        )}
                    </div>
                </motion.div>

                {/* 2. A CARROÇA (Worst Winrate Champ) - Span 5 */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
                    className="lg:col-span-12 xl:col-span-5 relative h-[400px] rounded-[2.5rem] overflow-hidden group shadow-xl border border-white/5"
                >
                    {worstChamp ? (
                        <>
                            <div className="absolute inset-0 bg-zinc-950" />
                            <div className="absolute inset-0 bg-cover bg-[position:center_top] transition-transform duration-[30s] ease-in-out group-hover:scale-110 opacity-40 grayscale group-hover:grayscale-0"
                                style={{ backgroundImage: `url(${champSplash})` }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-black/50 to-transparent" />

                            <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                                <div className="mb-auto inline-flex items-center gap-2 bg-red-500/10 backdrop-blur-md border border-red-500/20 px-3 py-1.5 rounded-full self-start shadow-lg shadow-red-900/10">
                                    <Ban className="w-3 h-3 text-red-500" />
                                    <span className="text-red-300 font-bold uppercase tracking-widest text-[10px]">A Carroça</span>
                                </div>

                                <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4 leading-[0.9] drop-shadow-xl text-balance">
                                    {worstChamp.championName}
                                </h2>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-red-950/40 backdrop-blur-md p-4 rounded-2xl border border-red-500/10 group-hover:border-red-500/30 transition-colors">
                                        <p className="text-[10px] text-red-300 uppercase font-bold tracking-widest mb-1">Partidas</p>
                                        <p className="text-2xl font-black text-white">{worstChamp.count}</p>
                                    </div>
                                    <div className="bg-red-950/40 backdrop-blur-md p-4 rounded-2xl border border-red-500/10 group-hover:border-red-500/30 transition-colors">
                                        <p className="text-[10px] text-red-300 uppercase font-bold tracking-widest mb-1">Winrate</p>
                                        <p className="text-2xl font-black text-red-500">
                                            {worstChamp.winrate.toFixed(0)}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 p-8 text-center">
                            <Ban className="w-12 h-12 mb-4 opacity-20" />
                            <h3 className="text-xl font-bold uppercase">Sem Carroças</h3>
                            <p className="text-sm">Incrível, nenhum campeão está trollando tanto assim.</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* LOWER GRID: MAIN SHAME STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. O Mochileiro (Lowest Score) */}
                {lowestScorePlayer && (
                    <InsightCard
                        delay={0.2}
                        icon={Anchor}
                        title="O Mochileiro"
                        subtitle="Menor Score"
                        value={lowestScorePlayer.avgScore.toFixed(1)}
                        player={lowestScorePlayer}
                        twColor="red"
                    />
                )}

                {/* 2. O Peso Morto (Worst Winrate) */}
                {worstWrPlayer && (
                    <InsightCard
                        delay={0.3}
                        icon={TrendingDown}
                        title="Peso Morto"
                        subtitle="Menor Winrate"
                        value={worstWrPlayer.winRate}
                        unit="%"
                        player={worstWrPlayer}
                        twColor="orange"
                    />
                )}

                {/* 3. O Agrônomo (Farm Simulator) */}
                {data.agronomo && (
                    <InsightCard
                        delay={0.4}
                        icon={Ban}
                        title="O Agrônomo"
                        subtitle="Colheita Feliz"
                        value={data.agronomo.value}
                        player={data.agronomo}
                        twColor="amber"
                    />
                )}
                {/* Fallback to Pacifista if no Agronomo */}
                {!data.agronomo && data.pacifista && (
                    <InsightCard
                        delay={0.4}
                        icon={Ban}
                        title="Pacifista"
                        subtitle="Dano Moral"
                        value={data.pacifista.value}
                        player={data.pacifista}
                        twColor="red"
                    />
                )}

                {/* 4. Mão de Alface (Conversion) - Moved here to fill 4 slots */}
                {data.alface && (
                    <InsightCard
                        delay={0.5}
                        icon={AlertTriangle}
                        title="Mão de Alface"
                        subtitle="Baixa Conversão"
                        value={data.alface.value}
                        player={data.alface}
                        twColor="orange"
                    />
                )}
            </div>

            {/* COMMUNITY SHAME GRID */}
            <div className="mt-8">
                <div className="flex items-center gap-3 mb-6 px-2">
                    <Ghost className="w-5 h-5 text-zinc-500" />
                    <h3 className="text-xl font-black text-zinc-400 uppercase italic tracking-wider">Mural da Vergonha</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stories.map((story: any, idx: number) => (
                        <InsightCard
                            key={idx}
                            delay={0.6 + (idx * 0.1)}
                            {...story}
                            twColor={story.twColor || "red"}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
