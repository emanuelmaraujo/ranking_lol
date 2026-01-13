'use client';

import { motion } from 'framer-motion';
import { Rocket, Zap, Sword, Timer, Crown, Flame, Trophy, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getGlobalHighlights, getPdlGainRanking, getHallOfFame, getSeasonRanking } from '@/lib/api';
import { getDateRange } from '@/lib/date-utils';
import { CHAMPION_SPLASH_BASE } from '@/lib/constants';
import { normalizeChampionName } from '@/lib/utils';
import { InsightCard } from '@/components/InsightCard';

/* 
  HighlightsView 3.0 (Community Edition)
  - Tone: Brazilian LoL Slang (O Smurf, Speedrun, O Monstro).
  - Features: MVP (Avg Score), Speedrun (Fastest Game).
  - Design: Premium Glass, Center-Face Crop.
*/

export function HighlightsView({ period, queue }: { period: any, queue: any }) {
    const [highlights, setHighlights] = useState<any>(null);
    const [climbers, setClimbers] = useState<any[]>([]);
    const [fame, setFame] = useState<any>(null);
    const [ranking, setRanking] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const range = getDateRange(period);
                const [hRes, cRes, fRes, rRes] = await Promise.all([
                    getGlobalHighlights(period, queue),
                    getPdlGainRanking(queue, 5, range?.start),
                    getHallOfFame(queue, range ? { start: range.start, end: range.end } : undefined),
                    getSeasonRanking(queue, 100, range ? { start: range.start, end: range.end } : undefined)
                ]);
                setHighlights(hRes);
                setClimbers(cRes.filter((c: any) => c.pdlGain > 0));
                setFame(fRes);
                setRanking(rRes);
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
    const titleSize = nameLen > 15 ? 'text-2xl md:text-3xl' : nameLen > 10 ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl';

    // Filter: Only > 2 matches
    const showChamp = highlights.popularChamp && highlights.popularChamp.count > 2;

    // --- POSITIVE TALES LOGIC (From HighlightsCarousel) ---
    const getStories = () => {
        const list: any[] = [];
        const activePuuids = new Set(ranking.map(r => r.puuid)); // Using ranking as base for active

        // 1. HALL OF FAME
        if (fame?.pentaKing) {
            list.push({
                icon: Sword,
                title: 'O Pai Tá On',
                subtitle: 'Rei do Pentakill',
                player: fame.pentaKing,
                value: fame.pentaKing.value,
                unit: 'Pentas',
                twColor: 'amber'
            });
        }
        if (fame?.stomper) {
            list.push({
                icon: Zap,
                title: 'Espanco',
                subtitle: 'Maior KDA',
                player: fame.stomper,
                value: fame.stomper.value,
                unit: 'KDA',
                twColor: 'blue'
            });
        }
        if (fame?.farmMachine) {
            list.push({
                icon: Star,
                title: 'Ministro da Economia',
                subtitle: 'Farm Machine',
                player: fame.farmMachine,
                value: typeof fame.farmMachine.value === 'number' ? fame.farmMachine.value.toFixed(1) : fame.farmMachine.value,
                unit: 'CS/m',
                twColor: 'green'
            });
        }
        if (fame?.objectiveKing) {
            list.push({
                icon: Trophy,
                title: 'Taxa do Drag',
                subtitle: 'Rei dos Objetivos',
                player: fame.objectiveKing,
                value: fame.objectiveKing.value,
                unit: 'Objs',
                twColor: 'purple'
            });
        }
        if (fame?.lateDemon) {
            const val = typeof fame.lateDemon.value === 'number' ? (fame.lateDemon.value / 60).toFixed(0) : fame.lateDemon.value;
            list.push({
                icon: Crown,
                title: 'Escalou',
                subtitle: 'Vitória Mais Longa',
                player: fame.lateDemon,
                value: val,
                unit: 'min',
                twColor: 'indigo'
            });
        }
        if (fame?.soloClutch) {
            const val = typeof fame.soloClutch.value === 'number' ? fame.soloClutch.value.toFixed(0) : fame.soloClutch.value;
            list.push({
                icon: Crown,
                title: 'Rei do X1',
                subtitle: 'Solo Kills',
                player: fame.soloClutch,
                value: val,
                unit: 'Abates',
                twColor: 'orange'
            });
        }

        // 2. CALCULATED (Hot Streak)
        const hotStreakPlayer = ranking.find(r => parseFloat(r.winRate) > 65 && r.gamesUsed > 5);
        if (hotStreakPlayer && !list.some(l => l.player.puuid === hotStreakPlayer.puuid)) {
            list.push({
                icon: Flame,
                title: 'Tá Voando',
                subtitle: 'Win Streak Insana',
                player: { ...hotStreakPlayer, profileIconId: hotStreakPlayer.profileIconId },
                value: hotStreakPlayer.winRate,
                unit: '%',
                twColor: 'red'
            });
        }

        // 3. PROMOTIONS (Climbers) - Top 1 is already in podium, maybe show others?
        // Let's just stick to unique insights not shown elsewhere or simplified versions

        return list.slice(0, 4); // Limit to 4 cards
    };

    const stories = getStories();

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4 pt-32 pb-24 font-[family-name:var(--font-outfit)]">

            {/* TOP SECTION: CHAMPION & PODIUM */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">

                {/* 1. CAMPEÃO DO MOMENTO (Hero - Span 5) */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
                    className="lg:col-span-12 xl:col-span-5 relative h-[400px] rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-black/50 border border-white/5"
                >
                    {showChamp ? (
                        <>
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
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 p-8 text-center">
                            <Star className="w-12 h-12 mb-4 opacity-20" />
                            <h3 className="text-xl font-bold uppercase">Sem Predileto</h3>
                            <p className="text-sm">Nenhum campeão se destacou ainda.</p>
                        </div>
                    )}
                </motion.div>

                {/* 2. PODIUM (Elegant Version - Span 7) */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
                    className="lg:col-span-12 xl:col-span-7 bg-[#09090b] rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden flex flex-col justify-between h-[400px]"
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
                {highlights.mvp && (
                    <InsightCard
                        delay={0.2}
                        icon={Star}
                        title="O Monstro"
                        subtitle="Maior Nota Média"
                        value={highlights.mvp.value.toFixed(1)}
                        player={highlights.mvp.player}
                        twColor="green"
                    />
                )}
                {highlights.bestWr && (
                    <InsightCard
                        delay={0.25}
                        icon={Zap}
                        title="O Smurf"
                        subtitle="Maior Winrate"
                        value={highlights.bestWr.value.toFixed(0)}
                        unit="%"
                        player={highlights.bestWr.player}
                        twColor="purple"
                    />
                )}
                {highlights.shortestGame && (
                    <InsightCard
                        delay={0.3}
                        icon={Timer}
                        title="Speedrun"
                        subtitle="Vitória Flash"
                        value={(highlights.shortestGame.value / 60).toFixed(0)}
                        unit="min"
                        player={highlights.shortestGame.player}
                        twColor="amber"
                    />
                )}
                {highlights.highestAssists && (
                    <InsightCard
                        delay={0.35}
                        icon={Trophy}
                        title="O Garçom"
                        subtitle="Mais Assistências"
                        value={highlights.highestAssists.value}
                        player={highlights.highestAssists.player}
                        twColor="blue"
                    />
                )}
            </div>

            {/* COMMUNITY INSIGHTS GRID */}
            {stories.length > 0 && (
                <div className="mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stories.map((story: any, idx: number) => (
                            <InsightCard
                                key={idx}
                                delay={0.4 + (idx * 0.1)}
                                {...story}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
