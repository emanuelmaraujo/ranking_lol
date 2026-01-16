'use client';

import { motion } from 'framer-motion';
import { Rocket, Zap, Sword, Timer, Crown, Flame, Trophy, Star, ArrowUpRight, TrendingUp, Crosshair, Coins, Eye, Skull, Pickaxe, User, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getGlobalHighlights, getPdlGainRanking, getHallOfFame, getSeasonRanking } from '@/lib/api';
import { getDateRange } from '@/lib/date-utils';
import { CHAMPION_SPLASH_BASE } from '@/lib/constants';
import { normalizeChampionName } from '@/lib/utils';
import { InsightCard } from '@/components/InsightCard';
import { getInsightContent } from '@/lib/insights-data';

/* 
  HighlightsView 4.0 (Bento Grid)
  - Layout: 12-column grid for asymmetrical balance.
  - Desktop: 8 (Podium) + 4 (Champ) | 3+3+3+3 (Ticker).
  - Mobile: Stacked blocks (12).
  - Visuals: "Stock Market" / "High Performance" aesthetic.
*/

export function HighlightsView({ period, queue }: { period: any, queue: any }) {
    const [highlights, setHighlights] = useState<any>(null);
    const [climbers, setClimbers] = useState<any[]>([]);
    const [fame, setFame] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const range = getDateRange(period);
                const [hRes, cRes, fRes] = await Promise.all([
                    getGlobalHighlights(period, queue),
                    getPdlGainRanking(queue, 3, range?.start), // Top 3 only
                    getHallOfFame(queue, range ? { start: range.start, end: range.end } : undefined)
                ]);
                setHighlights(hRes);
                setClimbers(cRes.filter((c: any) => c.pdlGain > 0));
                setFame(fRes);
            } catch (error) {
                console.error("Failed to fetch highlights", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [period, queue]);

    if (loading) return (
        <div className="w-full h-[60vh] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-white rounded-full animate-spin shadow-[0_0_30px_rgba(99,102,241,0.5)]" />
                <p className="text-indigo-300 font-bold tracking-[0.2em] uppercase text-xs">Carregando Foguetes...</p>
            </div>
        </div>
    );

    if (!highlights) return null;

    // Data Prep
    const champName = highlights.popularChamp?.name || '---';
    const champSplash = highlights.popularChamp ? `${CHAMPION_SPLASH_BASE}/${normalizeChampionName(champName)}_0.jpg` : '';
    const hasChamp = !!highlights.popularChamp && highlights.popularChamp.count >= 3 && highlights.popularChamp.winrate > 50;

    const BentoItem = ({ children, className, delay = 0 }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay }}
            className={`relative overflow-hidden rounded-[2rem] border border-white/5 bg-[#09090b]/80 backdrop-blur-md shadow-2xl ${className}`}
        >
            {children}
        </motion.div>
    );

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4 pb-24 font-[family-name:var(--font-outfit)]">

            {/* BENTO GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">

                {/* 1. THE PODIUM (Top Climbers) */}
                <BentoItem className="order-[-1] lg:order-none col-span-12 lg:col-span-8 h-auto min-h-[400px] lg:h-[450px] bg-gradient-to-br from-indigo-950/50 to-black group">
                    {/* Background FX - Always Absolute */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <div className="absolute top-0 right-0 p-32 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />

                    {/* Content Container - Mobile: Flow / Desktop: H-Full */}
                    <div className="relative z-10 w-full p-6 flex flex-col gap-8 lg:h-full lg:p-10 lg:gap-0 lg:justify-between">

                        {/* Header */}
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                    <Rocket className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter">Os Foguetes</h2>
                                    <p className="text-indigo-400/60 text-xs font-bold uppercase tracking-widest">Maiores Subidas de PDL</p>
                                </div>
                            </div>
                            <div className="self-start lg:self-auto flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 text-green-400 text-xs font-bold">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>Stonks 🚀</span>
                            </div>
                        </div>

                        {/* Podium Content - Horizontal Layout (Perfect Mobile) */}
                        <div className="flex-1 flex items-end justify-center gap-2 md:gap-8 pb-2 relative z-10">

                            {/* #2 Silver */}
                            <div className="flex flex-col items-center w-1/3 group/p2 relative mt-8 md:mt-0">
                                {climbers[1] ? (
                                    <>
                                        <div className="relative mb-2 md:mb-4 group-hover/p2:-translate-y-2 transition-transform duration-500">
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px] bg-gradient-to-b from-zinc-300 to-zinc-500 shadow-lg shadow-zinc-500/20">
                                                <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${climbers[1].profileIconId}.png`} className="w-full h-full rounded-full border-2 border-[#09090b] grayscale group-hover/p2:grayscale-0 transition-all" />
                                            </div>
                                            <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                                                <span className="bg-[#09090b] text-zinc-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-zinc-700 shadow-xl">#2</span>
                                            </div>
                                        </div>
                                        <h4 className="text-zinc-400 font-bold text-[10px] md:text-sm truncate max-w-[80px] md:max-w-[120px] mb-1 md:mb-2">{climbers[1].gameName}</h4>
                                        <div className="flex flex-col items-center justify-center p-2 md:p-3 w-full bg-zinc-900/30 border border-white/5 rounded-2xl backdrop-blur-md">
                                            <span className="text-lg md:text-2xl font-black text-white">+{climbers[1].pdlGain}</span>
                                            <span className="hidden md:block text-[9px] text-zinc-600 uppercase font-black tracking-widest">PDL</span>
                                        </div>
                                    </>
                                ) : <div className="h-20" />}
                            </div>

                            {/* #1 Gold */}
                            <div className="flex flex-col items-center w-1/3 group/p1 relative -mt-8 md:-mt-12 z-20">
                                {climbers[0] ? (
                                    <>
                                        <div className="relative mb-3 md:mb-6 group-hover/p1:-translate-y-2 transition-transform duration-500">
                                            <div className="absolute -inset-6 bg-yellow-500/20 blur-xl rounded-full opacity-60 animate-pulse" />
                                            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full p-[3px] bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-800 shadow-2xl shadow-yellow-500/30 relative z-10">
                                                <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${climbers[0].profileIconId}.png`} className="w-full h-full rounded-full border-4 border-[#09090b]" />
                                            </div>
                                            <div className="absolute -top-5 inset-x-0 flex justify-center z-20">
                                                <Crown className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
                                            </div>
                                        </div>
                                        <h4 className="text-white font-black text-xs md:text-lg truncate max-w-[100px] md:max-w-[150px] mb-1 md:mb-2">{climbers[0].gameName}</h4>
                                        <div className="flex flex-col items-center justify-center p-2 md:p-4 w-full bg-gradient-to-b from-yellow-950/20 to-yellow-900/5 border border-yellow-500/20 rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(234,179,8,0.05)]">
                                            <span className="text-2xl md:text-4xl font-black text-yellow-400 drop-shadow-sm">+{climbers[0].pdlGain}</span>
                                            <span className="text-[9px] md:text-[10px] text-yellow-500/60 uppercase font-black tracking-widest">Gain do Dia</span>
                                        </div>
                                    </>
                                ) : <div className="text-zinc-700 font-bold uppercase text-xs">Sem dados</div>}
                            </div>

                            {/* #3 Bronze */}
                            <div className="flex flex-col items-center w-1/3 group/p3 relative mt-12 md:mt-4">
                                {climbers[2] ? (
                                    <>
                                        <div className="relative mb-2 md:mb-4 group-hover/p3:-translate-y-2 transition-transform duration-500">
                                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full p-[2px] bg-gradient-to-b from-orange-300 to-orange-700 opacity-80 shadow-lg shadow-orange-700/20">
                                                <img src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${climbers[2].profileIconId}.png`} className="w-full h-full rounded-full border-2 border-[#09090b] grayscale group-hover/p3:grayscale-0 transition-all" />
                                            </div>
                                            <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                                                <span className="bg-[#09090b] text-orange-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-orange-900 shadow-xl">#3</span>
                                            </div>
                                        </div>
                                        <h4 className="text-zinc-500 font-bold text-[10px] md:text-xs truncate max-w-[80px] md:max-w-[100px] mb-1 md:mb-2">{climbers[2].gameName}</h4>
                                        <div className="flex flex-col items-center justify-center p-2 md:p-3 w-full bg-zinc-900/30 border border-white/5 rounded-2xl backdrop-blur-md">
                                            <span className="text-lg md:text-xl font-black text-zinc-500">+{climbers[2].pdlGain}</span>
                                        </div>
                                    </>
                                ) : <div className="h-20" />}
                            </div>

                        </div>
                    </div>
                </BentoItem>

                {/* 2. THE META PICK (Side Hero) */}
                <BentoItem className="order-[-2] lg:order-none col-span-12 lg:col-span-4 min-h-[400px] lg:h-[450px] group relative" delay={0.1}>
                    {hasChamp ? (
                        <>
                            <div className="absolute inset-0 bg-cover bg-[position:center_top] transition-transform duration-[20s] ease-in-out group-hover:scale-110 opacity-60" style={{ backgroundImage: `url(${champSplash})` }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                            <div className="relative z-10 w-full h-full p-6 md:p-8 flex flex-col justify-end">
                                <div className="mb-auto self-start">
                                    <div className="bg-emerald-500 text-black font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider shadow-lg animate-pulse">
                                        Free Elo
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2 opacity-80">
                                        <Star className="w-4 h-4 text-emerald-400" />
                                        <span className="text-emerald-300 font-bold text-xs uppercase tracking-widest">Boneco do Momento</span>
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-4">{champName}</h2>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-emerald-950/80 backdrop-blur border border-emerald-500/30 p-3 rounded-xl">
                                            <p className="text-[10px] text-emerald-400 font-bold uppercase">Taxa de Vitória</p>
                                            <p className="text-xl font-black text-white">{highlights.popularChamp.winrate.toFixed(0)}%</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur border border-white/10 p-3 rounded-xl">
                                            <p className="text-[10px] text-zinc-400 font-bold uppercase">Partidas</p>
                                            <p className="text-xl font-black text-white">{highlights.popularChamp.count}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 h-full text-zinc-600">
                            <Star className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-bold uppercase tracking-wider">Sem Meta Definido</p>
                        </div>
                    )}
                </BentoItem>

                {/* 3. PERFORMANCE TICKER (Bottom Row) - Span 3 each (4 items) */}
                {/* Desktop: 4 items spanning 3 cols each. Mobile: 2x2 grid (Span 6) or Stacked? Let's do 2x2 for mobile */}

                {/* DYNAMIC INSIGHTS GRID */}
                {/* 
                    We map through the insights. 
                    Order: MVP, Speedrun, Smurf, Slayer + New Ones (KDA, Dmg, Farm, Gold, Vision)
                */}
                {[
                    { key: 'mvp', data: highlights.mvp, icon: Trophy, color: 'purple', unit: '', valueMod: (v: number) => Math.round(v).toFixed(0) },
                    { key: 'highestScore', data: highlights.highestScore, icon: Star, color: 'yellow', unit: '', valueMod: (v: number) => v.toFixed(1) },
                    { key: 'bestWr', data: highlights.bestWr, icon: Zap, color: 'cyan', unit: '%', valueMod: (v: number) => v.toFixed(0) },
                    {
                        key: 'shortestGame',
                        data: highlights.shortestGame,
                        icon: Timer,
                        color: 'amber',
                        unit: '',
                        valueMod: (v: number) => {
                            const m = Math.floor(v / 60);
                            const s = (v % 60).toFixed(0).padStart(2, '0');
                            return `${m}:${s}`;
                        }
                    },
                    { key: 'stomper', data: fame?.stomper, icon: Sword, color: 'red', unit: '' },
                    { key: 'kdaKing', data: highlights.kdaKing, icon: Crosshair, color: 'emerald', unit: '', valueMod: (v: number) => v.toFixed(1) },
                    { key: 'highestDmg', data: highlights.highestDmg, icon: Skull, color: 'orange', unit: '', valueMod: (v: number) => Math.round(v).toLocaleString() }, // Integer formatting
                    { key: 'farmer', data: highlights.farmer, icon: Pickaxe, color: 'indigo', unit: '', valueMod: (v: number) => v.toFixed(1) },
                    { key: 'rich', data: highlights.rich, icon: Coins, color: 'yellow', unit: '', valueMod: (v: number) => Math.round(v).toLocaleString() },
                    { key: 'visionary', data: highlights.visionary, icon: Eye, color: 'zinc', unit: '', valueMod: (v: number) => v.toFixed(1) },
                    { key: 'mostActive', data: highlights.mostActive, icon: Flame, color: 'red', unit: '' }, // Viciado
                    { key: 'anjoDaGuarda', data: fame?.anjoDaGuarda, icon: Heart, color: 'pink', unit: '' }, // O Garçom
                    {
                        key: 'winStreak',
                        data: fame?.uniqueFeats?.find((f: any) => f.type === 'WIN_STREAK') || null,
                        icon: Rocket,
                        color: 'blue',
                        unit: ' partidas'
                    },
                    { key: 'survivor', data: highlights.survivor, icon: Heart, color: 'green', unit: '' },
                    { key: 'mono', data: highlights.mono, icon: User, color: 'rose', unit: '' },
                    { key: 'ocean', data: highlights.ocean, icon: User, color: 'cyan', unit: '' },
                    { key: 'objective', data: highlights.objective, icon: Crosshair, color: 'orange', unit: '' }
                ].map((item, idx) => {
                    if (!item.data) return null;

                    let content = getInsightContent(item.key, period);

                    // Fallback to defaults if content is missing
                    let title = content?.titulo || item.key;
                    let badge = content?.badge || '---';
                    let subtext = content?.subtexto;
                    let zoeira = content?.zoeira;

                    // --- LOGIC REFINEMENTS ---
                    // 1. MVP Threshold (Must be >= 50)
                    if (item.key === 'mvp' && Number(item.data.value) < 50) {
                        title = 'Nível Duvidoso';
                        badge = 'Crise';
                        zoeira = 'Hoje ninguém salvou';
                        // subtext = 'Pontuação abaixo da média'; // Optional override
                    }

                    // 2. Best Winrate Threshold (Must be > 50%)
                    if (item.key === 'bestWr' && Number(item.data.value) <= 50) {
                        title = 'Dia de Azar';
                        badge = 'Fila dos Desesperados';
                        zoeira = 'Melhor winrate é negativo...';
                    }

                    return (
                        <div key={item.key} className="lg:col-span-3 col-span-12">
                            <InsightCard
                                delay={0.2 + (idx * 0.05)}
                                icon={item.icon}
                                title={title}
                                badge={badge}
                                subtext={subtext}
                                zoeira={zoeira}
                                value={item.valueMod ? item.valueMod(Number(item.data.value)) : item.data.value}
                                unit={item.unit}
                                player={item.data.player || item.data}
                                twColor={item.color as any}
                            />
                        </div>
                    );
                })}

            </div>
        </div>
    );
}
