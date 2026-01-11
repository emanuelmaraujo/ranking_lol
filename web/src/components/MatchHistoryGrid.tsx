'use client';

import { MatchHistoryEntry } from '@/lib/api';
import { TierTheme } from '@/lib/tier-themes';
import { Swords, Shield, Crosshair, Zap, Trees, Grip, Clock, Skull, Trophy, Coins, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { DDRAGON_VERSION } from '@/lib/constants';
import { normalizeChampionName } from '@/lib/utils';

interface Props {
    history: MatchHistoryEntry[];
    theme: TierTheme;
    onSelectMatch?: (match: MatchHistoryEntry) => void;
}

export function MatchHistoryGrid({ history, theme, onSelectMatch }: Props) {
    if (!history.length) return <div className={`text-center py-10 ${theme.colors.textSecondary}`}>Nenhuma partida recente.</div>;

    return (
        <div className="space-y-2">
            {/* Headers (CSS Grid) */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr] md:grid-cols-[1.2fr_1fr_1fr_1fr_0.8fr_0.5fr] px-4 py-2 text-[10px] uppercase font-[family-name:var(--font-outfit)] font-bold tracking-wider text-zinc-500">
                <div>Campeão</div>
                <div className="text-center md:text-left">KDA</div>
                <div className="hidden md:block text-center">Recursos</div>
                <div className="text-center">Dano</div>
                <div className="text-center">Score</div>
                <div className="text-right">Resultado</div>
            </div>

            <div className="space-y-2">
                {history.map((match, idx) => (
                    <MatchRow key={match.matchId} match={match} theme={theme} index={idx} onClick={() => onSelectMatch?.(match)} />
                ))}
            </div>
        </div>
    );
}

function MatchRow({ match, theme, index, onClick }: { match: MatchHistoryEntry, theme: TierTheme, index: number, onClick: () => void }) {
    const isWin = match.isVictory;

    // Helper for lane icon
    const getLaneConfig = (lane: string) => {
        const map: any = {
            'TOP': { label: 'TOP', icon: Swords, color: 'text-orange-400' },
            'JUNGLE': { label: 'JNG', icon: Trees, color: 'text-emerald-400' },
            'MIDDLE': { label: 'MID', icon: Zap, color: 'text-purple-400' },
            'BOTTOM': { label: 'ADC', icon: Crosshair, color: 'text-blue-400' },
            'UTILITY': { label: 'SUP', icon: Shield, color: 'text-cyan-400' },
        };
        const key = lane === 'BOT' ? 'BOTTOM' : (lane === 'SUPPORT' ? 'UTILITY' : lane);
        return map[key] || { label: '???', icon: Grip, color: 'text-zinc-400' };
    };

    const laneConfig = getLaneConfig(match.lane);
    const LaneIcon = laneConfig.icon;

    // Formatters
    const formatNumber = (num: number) => {
        if (!num) return '-';
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
        return num.toString();
    };

    // Calculate time ago
    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Hoje';
        if (days === 1) return 'Ontem';
        return `${days}d`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
            className={`
                group relative grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr] md:grid-cols-[1.2fr_1fr_1fr_1fr_0.8fr_0.5fr] items-center px-4 py-3 ${theme.styles.borderRadius} cursor-pointer transition-all duration-300
                bg-black/20 hover:bg-white/5 border border-white/5 hover:border-white/10 overflow-hidden
            `}
        >
            {/* Left Border Indicator */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isWin ? 'bg-emerald-500' : 'bg-rose-500'} opacity-60 group-hover:opacity-100 transition-opacity`} />

            {/* Col 1: Champion & Lane */}
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative shrink-0">
                    <img
                        src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${normalizeChampionName(match.championName)}.png`}
                        alt={match.championName}
                        className={`w-10 h-10 rounded-lg object-cover border border-white/10 ${isWin ? 'shadow-[0_0_10px_rgba(16,185,129,0.2)]' : ''}`}
                    />
                    <div className="absolute -bottom-1 -right-1 bg-zinc-950 rounded p-0.5 border border-white/10">
                        <LaneIcon size={10} className={laneConfig.color} />
                    </div>
                </div>
                <div className="min-w-0">
                    <div className={`text-sm font-[family-name:var(--font-outfit)] font-bold ${theme.colors.text} truncate`}>{match.championName}</div>
                    <div className="text-[10px] text-zinc-500 font-mono tracking-wide">{laneConfig.label}</div>
                </div>
            </div>

            {/* Col 2: KDA */}
            <div className="text-center md:text-left flex flex-col justify-center">
                <div className="font-bold font-[family-name:var(--font-outfit)] text-sm text-zinc-200 group-hover:text-white transition-colors">
                    {match.kills}/{match.deaths}/{match.assists}
                </div>
                <div className={`text-[10px] font-bold ${Number(match.kda) >= 3 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {match.kda} KDA
                </div>
            </div>

            {/* Col 3: Resources (Hidden on small screens) */}
            <div className="hidden md:flex flex-col items-center justify-center gap-0.5">
                <div className="flex items-center gap-1 text-xs text-zinc-300" title="Gold Earned">
                    <Coins size={10} className="text-yellow-500" />
                    {formatNumber(match.gold)}
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-400" title="CS">
                    <Target size={10} className="text-zinc-500" />
                    {match.cs} <span className="text-[9px] opacity-50">CS</span>
                </div>
            </div>

            {/* Col 4: Extended Stats -> Damage (Assuming we have it, reusing logic or placeholder if backend not ready) */}
            <div className="text-center flex flex-col items-center justify-center">
                <div className="text-xs font-bold text-zinc-300">{formatNumber(match.damage || 0)}</div>
                <div className="text-[9px] text-zinc-500 uppercase">Dano</div>
            </div>

            {/* Col 5: Score */}
            <div className="text-center">
                <div className={`font-black font-[family-name:var(--font-outfit)] text-xl ${theme.colors.accent} opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all`}>
                    {match.score.toFixed(1)}
                </div>
                <div className="text-[8px] text-zinc-600 uppercase font-bold">RiftScore</div>
            </div>

            {/* Col 6: Result & Date */}
            <div className="text-right flex flex-col items-end gap-1">
                <div className={`
                    inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-[family-name:var(--font-outfit)] font-bold uppercase tracking-wider
                    ${isWin ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}
                `}>
                    {isWin ? 'Win' : 'Loss'}
                </div>
                <div className="text-[10px] font-[family-name:var(--font-outfit)] font-medium text-zinc-500 flex items-center justify-end gap-1">
                    {timeAgo(match.date)}
                </div>
            </div>
        </motion.div>
    );
}
