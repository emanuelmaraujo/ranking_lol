import { TierTheme } from "@/lib/tier-themes";
import { getStartOfWeek } from "@/lib/date-utils";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedCounter } from "./ui/AnimatedCounter";

interface WeeklyReportProps {
    theme: TierTheme;
    report: {
        wins: number;
        losses: number;
        total: number;
        winRate: string;
        pdlDelta: number;
    };
    title?: string;
}

export function WeeklyReportCard({ theme, report, title }: WeeklyReportProps) {
    // 1. Weekly Date Range
    const startOfWeek = getStartOfWeek();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const dateRangeStr = `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1} - ${endOfWeek.getDate()}/${endOfWeek.getMonth() + 1}`;

    const { wins, losses, total, winRate, pdlDelta } = report;
    const wrVal = parseFloat(winRate);

    const isPositive = pdlDelta > 0;
    const isNeutral = pdlDelta === 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${theme.styles.borderRadius} p-6 ${theme.colors.cardBg} relative overflow-hidden group`}
        >
            {/* Background Texture */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${theme.gradients.hero} opacity-20 blur-2xl rounded-full -mr-10 -mt-10`} />

            <div className="relative z-10">
                <h3 className={`text-sm font-[family-name:var(--font-outfit)] font-bold uppercase tracking-widest ${theme.colors.textSecondary} mb-4 flex items-center gap-2`}>
                    <Activity size={14} /> {title || 'Performance Semanal'}
                </h3>

                <div className="grid grid-cols-2 gap-6">
                    {/* PDL Delta Section */}
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-[family-name:var(--font-outfit)] font-black tracking-tighter ${isPositive ? 'text-emerald-400' : isNeutral ? 'text-zinc-400' : 'text-rose-400'}`}>
                                {isPositive ? '+' : ''}
                                <AnimatedCounter value={pdlDelta} />
                            </span>
                            <span className="text-xs font-[family-name:var(--font-outfit)] font-bold text-zinc-500 uppercase">PDL</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs font-[family-name:var(--font-outfit)] font-medium opacity-80">
                            {isPositive ? <TrendingUp size={12} className="text-emerald-400" /> : isNeutral ? <Minus size={12} /> : <TrendingDown size={12} className="text-rose-400" />}
                            <span className={theme.colors.textSecondary} title={`Semana: ${dateRangeStr}`}>desta semana</span>
                        </div>
                    </div>

                    {/* Winrate Mini Chart Section */}
                    <div className="flex flex-col justify-center">
                        <div className="flex justify-between text-xs font-[family-name:var(--font-outfit)] font-bold mb-1">
                            <span className="text-emerald-400">{wins}W</span>
                            <span className="text-rose-400">{losses}L</span>
                        </div>
                        {/* Winrate Bar */}
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${wrVal}%` }} />
                            <div className="bg-rose-500/50 h-full flex-1" />
                        </div>
                        <div className={`text-right text-[10px] font-[family-name:var(--font-outfit)] font-bold mt-1 ${theme.colors.textSecondary}`}>
                            {winRate}% WR ({total} jogos)
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
