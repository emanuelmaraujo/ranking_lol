import { motion, useScroll, useTransform } from 'framer-motion';
import { Crown, Trophy, TrendingUp, TrendingDown, Star, Sparkles } from 'lucide-react';
import { RankingEntry } from '@/lib/api';
import { useRef } from 'react';
import { normalizeChampionName } from '@/lib/utils';
import { CHAMPION_SPLASH_BASE } from '@/lib/constants';

interface HeroSectionProps {
    player: RankingEntry | null;
    pdlDelta?: number | null;
    period?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'GENERAL';
}

export function HeroSection({ player, pdlDelta, period = 'GENERAL' }: HeroSectionProps) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    if (!player) return null;

    // Use backend provided skin splash, or fallback to default
    const championName = player.mainChampion?.name || 'Aatrox';
    const normalizedName = normalizeChampionName(championName);
    const splashUrl = player.skin?.splashUrl || `${CHAMPION_SPLASH_BASE}/${normalizedName}_0.jpg`;

    // Dynamic Title Logic
    const getTitles = () => {
        switch (period) {
            case 'DAILY': return { badge: 'Destaque do Dia', title: 'Melhor do Dia' };
            case 'WEEKLY': return { badge: 'Destaque da Semana', title: 'Melhor da Semana' };
            case 'MONTHLY': return { badge: 'Destaque do Mês', title: 'Melhor do Mês' };
            default: return { badge: 'Rei da Comunidade', title: 'O Dono do Server' };
        }
    };
    const { badge, title } = getTitles();

    return (
        <section ref={ref} className="relative w-full max-w-[100%] md:max-w-[1400px] min-h-[400px] h-[75vh] lg:h-[800px] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden mb-12 md:mb-16 group shadow-2xl shadow-emerald-900/10 mx-auto">

            {/* PARALLAX BACKGROUND */}
            <motion.div
                className="absolute inset-0 z-0"
                style={{ y, opacity }}
            >
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] ease-in-out group-hover:scale-110"
                    style={{ backgroundImage: `url(${splashUrl})` }}
                />

                {/* Advanced Gradient Overlays for Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505]" />

                {/* Texture/Noise */}
                <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </motion.div>

            {/* CONTENT LAYER */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 md:p-16 lg:p-24 pb-20 md:pb-24">

                {/* Top Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="absolute top-6 left-6 md:top-12 md:left-12 flex items-center gap-3"
                >
                    <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-xl border border-yellow-500/40 px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                        <Crown className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-yellow-400 animate-pulse" />
                        <span className="text-yellow-100 font-bold uppercase tracking-widest text-[10px] md:text-xs">{badge}</span>
                    </div>
                </motion.div>

                {/* Main Player Info */}
                <div className="max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <h2 className="text-emerald-500 font-[family-name:var(--font-outfit)] font-bold text-sm md:text-xl md:text-2xl tracking-[0.2em] uppercase mb-2 flex items-center gap-3">
                            <span className='w-6 h-[2px] md:w-8 bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.8)]' />
                            {title}
                        </h2>
                        {/* Dynamic Font Scaling for Nickname */}
                        <h1 className={`${player.gameName.length > 12 ? (player.gameName.length > 16 ? 'text-3xl md:text-5xl lg:text-6xl' : 'text-4xl md:text-6xl lg:text-7xl') : 'text-5xl md:text-7xl lg:text-8xl'} font-[family-name:var(--font-outfit)] font-black text-white tracking-tighter uppercase leading-[0.9] mb-4 md:mb-6 drop-shadow-xl mix-blend-lighten whitespace-nowrap`}>
                            {player.gameName}
                            <span className="block md:inline text-2xl md:text-3xl md:text-4xl text-zinc-500 md:ml-2 font-medium tracking-normal normal-case opacity-60">#{player.tagLine}</span>
                        </h1>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="flex flex-wrap items-end gap-x-12 gap-y-8 mt-8"
                    >
                        {/* Rank Info */}
                        <div className="group/stat relative">
                            <div className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                Atualmente
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
                                    {player.tier}
                                </span>
                                <span className="text-2xl md:text-3xl font-light text-gray-400">
                                    {player.rankDivision}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-emerald-400 font-mono text-lg font-bold">{player.lp} PDL</span>
                                {(pdlDelta !== undefined && pdlDelta !== null && pdlDelta !== 0) && (
                                    <span className={`flex items-center text-sm font-bold px-2 py-0.5 rounded ${pdlDelta > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {pdlDelta > 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                                        {pdlDelta > 0 ? '+' : ''}{pdlDelta}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Score Info */}
                        <div className="pl-12 border-l border-white/10 hidden md:block">
                            <div className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                <Trophy size={14} className="text-yellow-500" /> Score Total
                            </div>
                            <div className="text-5xl font-bold text-white tracking-tight">
                                {Math.round(player.totalScore)}
                            </div>
                        </div>

                        {/* Champion Info */}
                        {player.mainChampion && (
                            <div className="pl-12 border-l border-white/10 hidden lg:block">
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <Star size={14} className="text-purple-500" /> Main Power
                                </div>
                                <div className="text-4xl font-bold text-white">
                                    {player.mainChampion.name}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {(player.mainChampion.points / 1000).toFixed(0)}k Mastery
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* DECORATIVE ELEMENTS */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#050505] to-transparent z-20" />

            {/* Animated Particles (CSS based for performance) */}
            <div className="absolute inset-0 z-1 pointer-events-none opacity-30">
                <style jsx>{`
                    .particle {
                        position: absolute;
                        background: white;
                        border-radius: 50%;
                        animation: float linear infinite;
                    }
                    @keyframes float {
                        0% { transform: translateY(0) translateX(0); opacity: 0; }
                        50% { opacity: 1; }
                        100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
                    }
                `}</style>
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: `${Math.random() * 3 + 1}px`,
                            height: `${Math.random() * 3 + 1}px`,
                            animationDuration: `${Math.random() * 5 + 5}s`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    />
                ))}
            </div>
        </section>
    );
}
