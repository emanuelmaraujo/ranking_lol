import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface InsightCardProps {
    title: string;
    badge: string;
    subtext?: string;
    zoeira?: string;
    value: string | number;
    unit?: string;
    icon: LucideIcon;
    player?: {
        gameName: string;
        profileIconId?: number | null;
    };
    twColor: 'amber' | 'blue' | 'green' | 'purple' | 'indigo' | 'orange' | 'red' | 'zinc' | 'cyan';
    delay?: number;
}

export function InsightCard({ title, badge, value, unit, icon: Icon, player, twColor, delay = 0, subtext, zoeira }: InsightCardProps) {
    const themeMap: any = {
        amber: { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/10', blur: 'bg-amber-500/5', hover: 'hover:border-amber-500/30', hoverBg: 'group-hover:bg-amber-500/10' },
        blue: { text: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/10', blur: 'bg-blue-500/5', hover: 'hover:border-blue-500/30', hoverBg: 'group-hover:bg-blue-500/10' },
        green: { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/10', blur: 'bg-emerald-500/5', hover: 'hover:border-emerald-500/30', hoverBg: 'group-hover:bg-emerald-500/10' },
        purple: { text: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/10', blur: 'bg-purple-500/5', hover: 'hover:border-purple-500/30', hoverBg: 'group-hover:bg-purple-500/10' },
        indigo: { text: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/10', blur: 'bg-indigo-500/5', hover: 'hover:border-indigo-500/30', hoverBg: 'group-hover:bg-indigo-500/10' },
        orange: { text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/10', blur: 'bg-orange-500/5', hover: 'hover:border-orange-500/30', hoverBg: 'group-hover:bg-orange-500/10' },
        red: { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/10', blur: 'bg-red-500/5', hover: 'hover:border-red-500/30', hoverBg: 'group-hover:bg-red-500/10' },
        zinc: { text: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/10', blur: 'bg-zinc-500/5', hover: 'hover:border-zinc-500/30', hoverBg: 'group-hover:bg-zinc-500/10' },
        cyan: { text: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/10', blur: 'bg-cyan-500/5', hover: 'hover:border-cyan-500/30', hoverBg: 'group-hover:bg-cyan-500/10' },
    };

    const theme = themeMap[twColor] || themeMap.amber;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`bg-[#09090b] rounded-[1.5rem] border border-white/5 p-5 relative overflow-hidden group ${theme.hover} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between h-[240px]`}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 ${theme.blur} blur-[40px] opacity-20 ${theme.hoverBg} transition-colors rounded-full -mr-10 -mt-10 pointer-events-none`} />

            {/* Header: Icon + Text Side-by-Side */}
            <div className="flex items-start gap-3 relative z-10">
                <div className={`w-10 h-10 rounded-xl ${theme.bg} ${theme.border} flex items-center justify-center shrink-0 border shadow-sm`}>
                    <Icon className={`w-5 h-5 ${theme.text}`} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                    <p className={`${theme.text} text-[10px] font-bold uppercase tracking-widest leading-tight mb-0.5 opacity-80 truncate`}>{badge || '---'}</p>
                    <h3 className="text-sm md:text-base font-black text-white uppercase italic tracking-tighter leading-[0.9] truncate" title={title}>{title}</h3>
                </div>
            </div>

            {/* Value & Player */}
            <div className="relative z-10">
                <div className="text-4xl font-black text-white mb-1 tracking-tighter leading-none flex items-baseline outline-text">
                    {value}
                    {unit && <span className={`text-xl ${theme.text} ml-1 font-bold opacity-80`}>{unit}</span>}
                </div>

                {/* Subtext (Stat Explanation) */}
                {subtext && (
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-3 truncate">
                        {subtext}
                    </div>
                )}

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                        {player ? (
                            <>
                                <div className="relative">
                                    <img
                                        src={`https://ddragon.leagueoflegends.com/cdn/16.1.1/img/profileicon/${player.profileIconId || 1}.png`}
                                        className="w-6 h-6 rounded-full border border-zinc-700 bg-zinc-800"
                                        alt={player.gameName}
                                    />
                                </div>
                                <span className="text-xs text-zinc-400 font-bold group-hover:text-zinc-300 transition-colors">{player.gameName}</span>
                            </>
                        ) : (
                            <span className="text-xs text-zinc-600 font-bold italic">Sem dados</span>
                        )}
                    </div>
                </div>

                {/* Zoeira (Sempre visível ou on hover? User disse: camada social. Deixar visivel no bottom) */}
                {zoeira && (
                    <div className={`mt-3 pt-3 border-t border-white/5 ${theme.text} text-[10px] font-bold uppercase tracking-widest opacity-80 italic`}>
                        "{zoeira}"
                    </div>
                )}
            </div>
        </motion.div>
    );
}
