'use client';

import { motion } from 'framer-motion';
import { TrendingDown, Timer, Ghost, Ban, AlertTriangle, EyeOff, Anchor, Skull, Truck, Crosshair, Siren } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getHallOfShame, getPdlGainRanking, getSeasonRanking } from '@/lib/api';
import { getDateRange } from '@/lib/date-utils';
import { CHAMPION_SPLASH_BASE } from '@/lib/constants';
import { normalizeChampionName } from '@/lib/utils';
import { InsightCard } from '@/components/InsightCard';

/* 
  BagresView 3.0 (Bento Grid - Crash Edition)
  - Theme: Stock Market Crash / Crime Scene.
  - Layout: 12-column Bento Grid.
  - Hero: "O Derretido" (Top Loser).
  - Side: "A Carroça" (Worst Champ).
*/

export function BagresView({ period, queue }: { period: any, queue: any }) {
    const [data, setData] = useState<any>(null);
    const [climbers, setClimbers] = useState<any[]>([]);
    const [ranking, setRanking] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBagres = async () => {
            setLoading(true);
            try {
                const range = getDateRange(period);
                const [hRes, pRes, rRes] = await Promise.all([
                    getHallOfShame(queue, range ? { start: range.start, end: range.end } : undefined),
                    getPdlGainRanking(queue, 50, range?.start),
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
        <div className="w-full h-[60vh] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-red-900 border-t-red-500 rounded-full animate-spin shadow-[0_0_30px_rgba(220,38,38,0.5)]" />
                <p className="text-red-800 font-bold tracking-[0.2em] uppercase text-xs">Investigando Crimes...</p>
            </div>
        </div>
    );

    if (!data) return null;

    // --- LOGIC ---
    // 1. HERO: O Derretido (Max PDL Loss)
    const losers = climbers.filter(c => c.pdlGain < 0).sort((a, b) => a.pdlGain - b.pdlGain);
    const topLoser = losers.length > 0 ? losers[0] : null;

    // 2. HERO: A Carroça (Worst Champ)
    const worstChamp = data.aCarroca && data.aCarroca.winrate < 50 ? data.aCarroca : null;
    const champSplash = worstChamp ? `${CHAMPION_SPLASH_BASE}/${normalizeChampionName(worstChamp.championName)}_0.jpg` : '';

    // 3. LOWEST SCORE
    const lowestScorePlayer = ranking.filter(r => r.gamesUsed > 0).sort((a, b) => a.avgScore - b.avgScore)[0] || null;

    // 4. WORST WINRATE
    // Filter out players who actually have a positive winrate (>= 50%)
    const worstWrPlayer = ranking
        .filter(r => r.gamesUsed >= 5 && parseFloat(r.winRate) < 50)
        .sort((a, b) => parseFloat(a.winRate) - parseFloat(b.winRate))[0];

    // Helper for Bento Items
    const BentoItem = ({ children, className, delay = 0 }: any) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay }}
            className={`relative overflow-hidden rounded-[2rem] border border-white/5 bg-[#0a0505]/90 backdrop-blur-md shadow-2xl ${className}`}
        >
            {children}
        </motion.div>
    );

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4 pb-24 font-[family-name:var(--font-outfit)]">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">

                {/* 1. O DERRETIDO (Hero - Span 8) */}
                <BentoItem className="order-[-1] lg:order-none col-span-12 lg:col-span-8 h-auto min-h-[400px] lg:h-[420px] bg-gradient-to-br from-red-950/40 to-black group border-red-900/40">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
                    {/* Glitch Overlay */}
                    <div className="absolute inset-0 bg-red-900/5 mix-blend-overlay" />

                    <div className="absolute inset-0 p-4 md:p-10 flex flex-col">

                        {/* Header */}
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 animate-pulse">
                                    <Siren className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter">O Derretido</h2>
                                    <p className="text-red-500/60 text-xs font-bold uppercase tracking-widest">Maior Prejuízo</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20 text-red-400 text-xs font-bold">
                                <TrendingDown className="w-3 h-3" />
                                <span>CRASH</span>
                            </div>
                        </div>

                        {/* Content */}
                        {topLoser ? (
                            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 relative z-10">

                                {/* Avatar with Glitch Effect */}
                                <div className="relative group/avatar">
                                    <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 group-hover/avatar:opacity-40 transition-opacity duration-300 animate-pulse" />
                                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-b from-red-900 via-red-600 to-black relative z-10">
                                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-black bg-black">
                                            <img
                                                src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${topLoser.profileIconId}.png`}
                                                className="w-full h-full object-cover grayscale contrast-125 group-hover/avatar:grayscale-0 transition-all duration-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20">
                                        <span className="bg-red-600 text-white text-[10px] uppercase font-black px-3 py-1 rounded-sm tracking-widest shadow-lg shadow-red-900/50 -rotate-2 inline-block">
                                            PROCURADO
                                        </span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="text-center md:text-left">
                                    <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase mb-2">{topLoser.gameName}</h3>
                                    <div className="inline-flex flex-col">
                                        <div className="flex items-baseline gap-2 text-red-500 bg-red-950/30 px-6 py-3 rounded-2xl border border-red-500/20 backdrop-blur-sm">
                                            <span className="text-6xl md:text-7xl font-black tracking-tighter">{topLoser.pdlGain}</span>
                                            <span className="text-xl font-bold uppercase tracking-widest opacity-60">PDL</span>
                                        </div>
                                        <p className="text-red-400/60 text-xs font-bold uppercase tracking-widest mt-2 text-center">Patrimônio Líquido Derretido</p>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest">
                                Nenhum suspeito encontrado
                            </div>
                        )}
                    </div>
                </BentoItem>

                {/* 2. A CARROÇA (Side Hero - Span 4) */}
                <BentoItem className="order-[-2] lg:order-none col-span-12 lg:col-span-4 min-h-[400px] lg:h-[420px] group border-red-900/20" delay={0.1}>
                    {worstChamp ? (
                        <>
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-in-out group-hover:scale-110 opacity-40 grayscale contrast-125" style={{ backgroundImage: `url(${champSplash})` }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-black/80 to-transparent" />

                            {/* BANNED Stamp Overlay */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-red-500/30 px-8 py-2 -rotate-12 opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity">
                                <span className="text-4xl font-black text-red-500/30 uppercase tracking-[0.2em] whitespace-nowrap group-hover:text-red-500/80 transition-colors">CRIMINOSO</span>
                            </div>

                            <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                                <div className="self-start">
                                    <div className="bg-red-950/80 text-red-400 font-black text-[10px] px-2 py-1 rounded border border-red-500/20 uppercase tracking-wider flex items-center gap-2">
                                        <Ban className="w-3 h-3" />
                                        <span>Evite isso</span>
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter mb-4 text-balance">{worstChamp.championName}</h2>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-black/60 backdrop-blur border border-red-500/20 p-3 rounded-xl">
                                            <p className="text-[10px] text-red-400 font-bold uppercase">Taxa de Vitória</p>
                                            <p className="text-xl font-black text-red-500">{worstChamp.winrate.toFixed(0)}%</p>
                                        </div>
                                        <div className="bg-black/60 backdrop-blur border border-white/5 p-3 rounded-xl">
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase">Partidas</p>
                                            <p className="text-xl font-black text-zinc-300">{worstChamp.count}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                            <Ghost className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-bold uppercase tracking-wider">Sem Carroças</p>
                        </div>
                    )}
                </BentoItem>

                {/* 3. WALL OF SHAME (Ticker - 4 Cols) */}
                {/* Standardized InsightCards for quick stats */}

                {/* O Mochileiro */}
                <div className="lg:col-span-3 col-span-12">
                    {lowestScorePlayer && (
                        <InsightCard
                            delay={0.2}
                            icon={Anchor}
                            title="O Mochileiro"
                            badge="Score Baixo"
                            subtext="Média de Score"
                            zoeira="Carregado com sucesso"
                            value={lowestScorePlayer.avgScore.toFixed(1)}
                            player={lowestScorePlayer}
                            twColor="red"
                        />
                    )}
                </div>

                {/* Peso Morto */}
                <div className="lg:col-span-3 col-span-12">
                    {worstWrPlayer && (
                        <InsightCard
                            delay={0.3}
                            icon={TrendingDown}
                            title="Peso Morto"
                            badge="Winrate"
                            subtext="Taxa de Vitória"
                            zoeira="A âncora do time"
                            value={String(parseFloat(worstWrPlayer.winRate).toFixed(0))}
                            unit="%"
                            player={worstWrPlayer}
                            twColor="orange"
                        />
                    )}
                </div>

                {/* Agronomo / Pacifista */}
                <div className="lg:col-span-3 col-span-12">
                    {data.agronomo ? (
                        <InsightCard
                            delay={0.4}
                            icon={Ban}
                            title="O Agrônomo"
                            badge="Sem Farm"
                            subtext="CS/min"
                            zoeira="Alergia a minions"
                            value={data.agronomo.value}
                            player={data.agronomo}
                            twColor="amber"
                        />
                    ) : (data.pacifista ? (
                        <InsightCard
                            delay={0.4}
                            icon={Ban}
                            title="Pacifista"
                            badge="Zero Dano"
                            subtext="Dano Total"
                            zoeira="Curador de inimigos"
                            value={data.pacifista.value}
                            player={data.pacifista}
                            twColor="red"
                        />
                    ) : null)}
                </div>

                {/* Cego / Ilusionista */}
                <div className="lg:col-span-3 col-span-12">
                    {data.cego ? (
                        <InsightCard
                            delay={0.5}
                            icon={EyeOff}
                            title="O Cego"
                            badge="Sem Visão"
                            subtext="Visão/min"
                            zoeira="Monitor desligado"
                            value={data.cego.value}
                            unit="Vis/min"
                            player={data.cego}
                            twColor="zinc"
                        />
                    ) : (data.ilusionista ? (
                        <InsightCard
                            delay={0.5}
                            icon={Ghost}
                            title="Ilusionista"
                            badge="Nulo"
                            subtext="Participação"
                            zoeira="Sumiu do jogo"
                            value={data.ilusionista.value}
                            player={data.ilusionista}
                            twColor="zinc"
                        />
                    ) : null)}
                </div>

            </div>

            {/* EXTRA SHAME GRID (If we have more data like iFood, Finado etc) */}
            <div className="flex flex-wrap gap-4 mt-4">
                {/* Logic to show extras if they exist and weren't shown above could go here, 
                     but for layout cleanness we stick to the main grid. 
                     If the user wants ALL shame cards, we can iterate them.
                  */}
                {data.finado && (
                    <div className="w-full md:w-[calc(25%-1rem)]">
                        <InsightCard
                            icon={Skull}
                            title="O Finado"
                            badge="Feeder"
                            subtext="Mortes"
                            zoeira="Simulador de morte"
                            value={data.finado.value}
                            player={data.finado}
                            twColor="red"
                        />
                    </div>
                )}
                {data.ifood && (
                    <div className="w-full md:w-[calc(25%-1rem)]">
                        <InsightCard
                            icon={Truck}
                            title="iFood"
                            badge="Delivery"
                            subtext="Entregas"
                            zoeira="Entregas rápidas"
                            value={data.ifood.value}
                            player={data.ifood}
                            twColor="red"
                        />
                    </div>
                )}
            </div>

        </div>
    );
}
