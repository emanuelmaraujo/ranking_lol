"use client";

import { useQueue } from "@/contexts/QueueContext";
import { Menu, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

interface TopbarProps {
    onMenuClick: () => void;
    isScrolled?: boolean;
}

export function Topbar({ onMenuClick, isScrolled = false }: TopbarProps) {
    const { queueType, setQueueType } = useQueue();

    return (
        <header
            className={`h-24 flex items-center justify-between px-8 transition-all duration-500 ${isScrolled
                ? "bg-black/10 backdrop-blur-sm border-b border-white/5"
                : "bg-transparent border-b border-transparent"
                }`}
        >
            {/* Left: Menu & Brand */}
            <div className="flex items-center gap-6">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 rounded-xl lg:hidden text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div className={`flex flex-col justify-center transition-all duration-500 ${isScrolled ? "opacity-30 hover:opacity-100" : "opacity-100"}`}>
                    <h1 className="text-3xl font-[family-name:var(--font-outfit)] font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-[size:200%] animate-shine drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                        RANKING <span className="text-white">2026</span>
                    </h1>
                </div>
            </div>

            {/* Right: Queue Toggle */}
            <div className={`flex items-center gap-4 transition-all duration-500 ${isScrolled ? "opacity-60 hover:opacity-100" : "opacity-100"}`}>
                <div className="flex bg-black/30 p-1 rounded-xl border border-white/5 backdrop-blur-md">
                    <button
                        onClick={() => setQueueType("SOLO")}
                        className={`px-3 py-2 md:px-6 md:py-2.5 rounded-lg text-xs md:text-sm font-bold font-[family-name:var(--font-outfit)] tracking-wider transition-all duration-300 ${queueType === "SOLO"
                            ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                            }`}
                    >
                        SOLO
                    </button>
                    <button
                        onClick={() => setQueueType("FLEX")}
                        className={`px-3 py-2 md:px-6 md:py-2.5 rounded-lg text-xs md:text-sm font-bold font-[family-name:var(--font-outfit)] tracking-wider transition-all duration-300 ${queueType === "FLEX"
                            ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                            }`}
                    >
                        FLEX
                    </button>
                </div>
            </div>
        </header>
    );
}
