'use client';

import { Swords, Zap, Crosshair, Shield, Trees, Filter, Search, X } from 'lucide-react';

interface Props {
    players: { gameName: string, tagLine: string, puuid: string }[];
    filters: {
        player: string;
        lane: string;
        champion?: string;
    };
    onChange: (key: string, value: string) => void;
}

export function MatchesFilterBar({ players, filters, onChange }: Props) {
    const lanes = [
        { id: 'TOP', icon: Swords, color: 'text-orange-400' },
        { id: 'JUNGLE', icon: Trees, color: 'text-green-400' },
        { id: 'MIDDLE', icon: Zap, color: 'text-purple-400' },
        { id: 'BOTTOM', icon: Crosshair, color: 'text-blue-400' },
        { id: 'UTILITY', icon: Shield, color: 'text-cyan-400' },
    ];

    return (
        <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-6 justify-between items-center shadow-xl mb-8">

            {/* 1. Player Select */}
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400">
                    <Search size={20} />
                </div>
                <div className="relative flex-1 md:w-[250px]">
                    <select
                        value={filters.player}
                        onChange={(e) => onChange('player', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white appearance-none focus:outline-none focus:border-[var(--color-primary)] transition-colors cursor-pointer"
                    >
                        <option value="">Todos os Jogadores</option>
                        {players.map(p => (
                            <option key={p.puuid} value={p.puuid}>
                                {p.gameName}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                        <Filter size={14} />
                    </div>
                </div>
            </div>

            {/* 2. Lane Selector */}
            <div className="flex flex-wrap justify-center bg-black/40 p-1.5 rounded-xl border border-white/5">
                <button
                    onClick={() => onChange('lane', '')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.lane === ''
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    ALL
                </button>
                {lanes.map(lane => {
                    const isActive = filters.lane === lane.id;
                    return (
                        <button
                            key={lane.id}
                            onClick={() => onChange('lane', isActive ? '' : lane.id)}
                            className={`p-1.5 rounded-lg transition-all mx-0.5 ${isActive
                                ? 'bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)]'
                                : 'hover:bg-white/5 opacity-50 hover:opacity-100'}`}
                            title={lane.id}
                        >
                            <lane.icon
                                size={18}
                                className={isActive ? lane.color : 'text-zinc-400'}
                            />
                        </button>
                    );
                })}
            </div>



            {/* 3. Champion Filter */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
                    <Search size={14} />
                </div>
                <input
                    type="text"
                    placeholder="Campeão..."
                    value={filters.champion || ''}
                    onChange={(e) => onChange('champion', e.target.value)}
                    className="w-32 bg-black/40 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 transition-all uppercase tracking-wider"
                />
            </div>

            {/* Clear Filters (Only if active) */}
            {(filters.player || filters.lane || filters.champion) && (
                <button
                    onClick={() => { onChange('player', ''); onChange('lane', ''); onChange('champion', ''); }}
                    className="flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
                >
                    <X size={14} /> Limpar
                </button>
            )}
        </div>
    );
}
