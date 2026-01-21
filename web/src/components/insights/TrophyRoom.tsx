"use client";

import { motion } from "framer-motion";
import { Skull, Target, Swords, ShieldCheck, Trophy } from "lucide-react";

interface TrophyRoomProps {
    trophies: {
        penta: number;
        quadra: number;
        triple: number;
        epicSteals: number;
    };
}

export function TrophyRoom({ trophies }: TrophyRoomProps) {
    if (!trophies) return null;

    const items = [
        { label: "Pentakill", count: trophies.penta, icon: Skull, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", shadow: "shadow-amber-500/10" },
        { label: "Quadrakill", count: trophies.quadra, icon: Target, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", shadow: "shadow-rose-500/10" },
        { label: "Triplekill", count: trophies.triple, icon: Swords, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", shadow: "shadow-orange-500/10" },
        { label: "Roubos", count: trophies.epicSteals, icon: ShieldCheck, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", shadow: "shadow-purple-500/10" },
    ];

    // Only show if at least one achievement > 0? Or show zeros?
    // Showing zeros is fine, or maybe "Locked" state.
    // Let's use "Locked" opacity for 0.

    return (
        <div className="bg-black/20 rounded-2xl border border-white/5 p-6 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <Trophy size={20} className="text-yellow-400" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white">Sala de Troféus</h4>
                    <p className="text-[10px] text-zinc-500 uppercase">Feitos da Temporada</p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                {items.map((item, i) => {
                    const isUnlocked = item.count > 0;
                    const Icon = item.icon;

                    return (
                        <div key={i} className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${isUnlocked ? `${item.bg} ${item.border} ${item.shadow} shadow-lg scale-100` : 'bg-white/5 border-white/5 opacity-50 grayscale'}`}>
                            <div className={`mb-2 ${isUnlocked ? item.color : 'text-zinc-500'}`}>
                                <Icon size={24} strokeWidth={2.5} />
                            </div>
                            <div className="text-2xl font-bold text-white mb-0.5 tracking-tighter">
                                {item.count}
                            </div>
                            <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                                {item.label}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
