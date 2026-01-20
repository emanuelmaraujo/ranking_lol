import { RelationNode } from '@/lib/api';
import { motion, Variants } from 'framer-motion';
import { Flame, HeartCrack, Swords, Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface SynergyCardProps {
    relation: RelationNode;
    rank: number;
    type?: 'GOOD' | 'BAD';
}

const itemVariants: Variants = {
    hidden: { opacity: 0, x: -20, filter: 'blur(5px)' },
    show: {
        opacity: 1,
        x: 0,
        filter: 'blur(0px)',
        transition: { type: "spring", stiffness: 50, damping: 15 }
    },
    hover: {
        scale: 1.02,
        backgroundColor: "rgba(255,255,255,0.03)",
        borderColor: "rgba(255,255,255,0.1)",
        transition: { duration: 0.2 }
    }
};

const translateLane = (lane: string) => {
    return lane
        .replace('TOP', 'Top')
        .replace('JUNGLE', 'JG')
        .replace('MIDDLE', 'Mid')
        .replace('BOTTOM', 'ADC')
        .replace('UTILITY', 'Sup')
        .replace('|', ' + ');
};

export function SynergyCard({ relation, rank, type = 'GOOD' }: SynergyCardProps) {
    const isGood = type === 'GOOD';

    // Explicit styles map to avoid dynamic class purging issues
    const styles = isGood ? {
        border: 'border-emerald-500/20',
        bg: 'from-emerald-950/20',
        glow: 'bg-emerald-500/10',
        textMain: 'text-emerald-400',
        textDim: 'text-emerald-500/40',
        badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        icon: 'text-emerald-500'
    } : {
        border: 'border-red-500/20',
        bg: 'from-red-950/20',
        glow: 'bg-red-500/10',
        textMain: 'text-red-400',
        textDim: 'text-red-500/40',
        badge: 'bg-red-500/10 text-red-300 border-red-500/20',
        icon: 'text-red-500'
    };

    return (
        <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            whileHover="hover"
            className={`relative group overflow-hidden rounded-xl border ${styles.border} bg-gradient-to-r ${styles.bg} to-transparent p-3 transition-all backdrop-blur-sm shadow-sm hover:shadow-md hover:shadow-black/40`}
        >
            {/* Ambient Glow */}
            <div className={`absolute -right-10 -top-10 w-40 h-40 ${styles.glow} blur-[60px] rounded-full group-hover:opacity-75 transition-opacity opacity-50 pointer-events-none`} />

            <div className="relative z-10 flex items-center justify-between gap-3">
                {/* Rank & Players */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`text-xl font-black italic ${styles.textDim} w-6 flex-shrink-0 text-center`}>
                        #{rank}
                    </div>

                    <div className="flex -space-x-3 flex-shrink-0">
                        {relation.players.map((p, i) => (
                            <div key={i} className="relative transition-transform group-hover:translate-x-1 group-hover:first:translate-x-0">
                                <img
                                    src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${p.profileIconId}.png`}
                                    className={`w-10 h-10 rounded-full border-2 border-[#1a1a1a] group-hover:border-white/20 transition-colors bg-black`}
                                    alt={p.gameName}
                                    title={`${p.gameName} #${p.tagLine}`}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-baseline gap-1 truncate text-sm font-bold text-zinc-100">
                            <span className="truncate max-w-[80px] sm:max-w-none">{relation.players[0].gameName}</span>
                            <span className="text-zinc-500 text-[10px]">&</span>
                            <span className="truncate max-w-[80px] sm:max-w-none">{relation.players[1].gameName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider ${styles.badge}`}>
                                {translateLane(relation.mainLane)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="text-right flex-shrink-0">
                    <div className="flex items-center justify-end gap-1.5 mb-0.5">
                        {isGood ? <TrendingUp className={`w-3.5 h-3.5 ${styles.icon}`} /> : <TrendingDown className={`w-3.5 h-3.5 ${styles.icon}`} />}
                        <span className={`text-xl font-black ${styles.textMain} tabular-nums leading-none`}>
                            {relation.winRate.toFixed(0)}%
                        </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-medium">
                        {relation.games} Games
                    </div>
                    <div className={`text-[10px] font-mono mt-0.5 ${relation.deltaScore > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {relation.deltaScore > 0 ? '+' : ''}{relation.deltaScore.toFixed(1)} Score
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
