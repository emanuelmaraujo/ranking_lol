'use client';

import { MatchHistoryEntry } from '@/lib/api';
import { Swords, Shield, Crosshair, Zap, Trees, Grip } from 'lucide-react';
import { DDRAGON_VERSION } from '@/lib/constants';
import { normalizeChampionName } from '@/lib/utils';
import { formatMatchDate, formatMatchTime } from '@/lib/date-utils';

interface Props {
    history: MatchHistoryEntry[];
    onSelectMatch?: (match: MatchHistoryEntry) => void;
}

export function MatchHistoryTable({ history, onSelectMatch }: Props) {
    // Helper for lane icon/color
    const getLaneBadge = (lane: string) => {
        const map: Record<string, { label: string, color: string, icon: any }> = {
            'TOP': { label: 'TOP', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', icon: Swords },
            'JUNGLE': { label: 'JNG', color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: Trees },
            'MIDDLE': { label: 'MID', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: Zap },
            'BOTTOM': { label: 'ADC', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: Crosshair },
            'UTILITY': { label: 'SUP', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20', icon: Shield },
        };
        const key = lane === 'BOT' ? 'BOTTOM' : (lane === 'SUPPORT' ? 'UTILITY' : lane);
        return map[key] || { label: lane.substring(0, 3), color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', icon: Grip };
    };

    return (
        <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.05)] shadow-xl bg-[var(--color-surface)]/40 backdrop-blur-md">

            {/* MOBILE CARD VIEW (< md) */}
            <div className="md:hidden divide-y divide-white/5">
                {history.map((match) => {
                    const laneBadge = getLaneBadge(match.lane);
                    const LaneIcon = laneBadge.icon;

                    return (
                        <div
                            key={match.matchId}
                            onClick={() => onSelectMatch?.(match)}
                            className="p-4 active:bg-white/5 transition-colors cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        {match.championId ? (
                                            <img
                                                src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${normalizeChampionName(match.championName)}.png`}
                                                alt={match.championName}
                                                className="w-12 h-12 rounded-full border-2 border-gray-800 shadow-lg"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xs border-2 border-gray-700">?</div>
                                        )}
                                        <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border border-black/50 shadow-sm text-[8px] bg-black ${laneBadge.color.split(' ')[0]}`}>
                                            <LaneIcon size={12} strokeWidth={3} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-lg leading-none">{match.championName}</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {formatMatchDate(match.date)} • {formatMatchTime(match.date)}
                                        </div>
                                    </div>
                                </div>

                                <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${match.isVictory
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>
                                    {match.isVictory ? 'Vitória' : 'Derrota'}
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-black/20 rounded-lg p-2 border border-white/5">
                                <div className="text-center px-2">
                                    <div className="text-[9px] uppercase text-gray-500 font-bold tracking-wider mb-0.5">KDA</div>
                                    <div className="text-gray-200 font-mono font-bold text-sm">{match.kda}</div>
                                </div>
                                <div className="w-px h-6 bg-white/5" />
                                <div className="text-center px-2">
                                    <div className="text-[9px] uppercase text-gray-500 font-bold tracking-wider mb-0.5">Score</div>
                                    <div className="text-[var(--color-primary)] font-black text-lg leading-none drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]">
                                        {match.score.toFixed(1)}
                                    </div>
                                </div>
                                <div className="w-px h-6 bg-white/5" />
                                <div className="text-center px-2">
                                    <div className="text-[9px] uppercase text-gray-500 font-bold tracking-wider mb-0.5">Lane</div>
                                    <div className="text-gray-300 font-mono text-xs">{laneBadge.label}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {history.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        Nenhuma partida encontrada nesta fila.
                    </div>
                )}
            </div>

            {/* DESKTOP VIEW (md+) */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-black/20 text-[var(--color-text-secondary)] border-b border-white/5 uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                            <th className="p-4">Campeão</th>
                            <th className="p-4">Resultado</th>
                            <th className="p-4 text-center">KDA</th>
                            <th className="p-4 text-center">Score</th>
                            <th className="p-4 text-right">Data</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {history.map((match) => {
                            const laneBadge = getLaneBadge(match.lane);
                            const LaneIcon = laneBadge.icon;

                            return (
                                <tr
                                    key={match.matchId}
                                    onClick={() => onSelectMatch?.(match)}
                                    className="group hover:bg-white/5 transition-all cursor-pointer relative"
                                >
                                    {/* Hover Indicator */}
                                    <td className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* Champion & Lane */}
                                    <td className="p-4 font-bold text-white pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                {match.championId ? (
                                                    <img
                                                        src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${normalizeChampionName(match.championName)}.png`}
                                                        alt={match.championName}
                                                        className="w-10 h-10 rounded-full border-2 border-gray-800 group-hover:border-[var(--color-primary)] transition-colors shadow-lg"
                                                        width={40}
                                                        height={40}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xs border-2 border-gray-700">?</div>
                                                )}
                                                <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border border-black/50 shadow-sm text-[8px] bg-black ${laneBadge.color.split(' ')[0]}`}>
                                                    <LaneIcon size={10} strokeWidth={3} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold leading-none">{match.championName}</div>
                                                <div className="text-[10px] text-gray-500 font-mono mt-0.5">{laneBadge.label}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Result */}
                                    <td className="p-4">
                                        <div className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border transition-shadow duration-300 ${match.isVictory
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                            : 'bg-red-500/10 text-red-400 border-red-500/20 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                            }`}>
                                            {match.isVictory ? 'Vitória' : 'Derrota'}
                                        </div>
                                    </td>

                                    {/* KDA */}
                                    <td className="p-4 text-center">
                                        <div className="font-mono font-bold text-md text-gray-200 group-hover:text-white transition-colors">{match.kda}</div>
                                    </td>

                                    {/* RiftScore */}
                                    <td className="p-4 text-center">
                                        <div className="font-bold text-lg text-[var(--color-primary)] group-hover:text-[var(--color-primary-hover)] transition-colors drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] group-hover:scale-110 transform duration-300">
                                            {match.score.toFixed(1)}
                                        </div>
                                    </td>

                                    {/* Date */}
                                    <td className="p-4 text-right text-[var(--color-text-secondary)] text-xs font-mono">
                                        <div>{formatMatchDate(match.date)}</div>
                                        <div className="text-[10px] text-gray-500">{formatMatchTime(match.date)}</div>
                                    </td>
                                </tr>
                            );
                        })}
                        {history.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    Nenhuma partida encontrada nesta fila.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
