import { useEffect, useState } from "react";
import { getSystemStatus } from "@/lib/api";
// import { formatDistanceToNow } from "date-fns"; // Removed
// import { ptBR } from "date-fns/locale"; // Removed

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, TrendingUp, Users, Home, Activity, X, Info, Swords } from "lucide-react";

interface SidebarProps {
    onClose?: () => void;
}

const MENU_ITEMS = [
    { label: "Geral", href: "/", icon: Home },
    { label: "Ranking", href: "/ranking/elo", icon: Trophy },
    { label: "Partidas Gerais", href: "/matches", icon: Swords },
    { label: "Ganho de PDL", href: "/ranking/pdl", icon: TrendingUp },
    { label: "Jogadores", href: "/players", icon: Users },
    { label: "Insights", href: "/insights", icon: Activity },
    { label: "Ajuda & Regras", href: "/help", icon: Info },
];

export function Sidebar({ onClose }: SidebarProps) {
    const pathname = usePathname();
    const [status, setStatus] = useState<{ lastUpdate: string | null; nextUpdate: string | null }>({ lastUpdate: null, nextUpdate: null });
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        getSystemStatus().then(setStatus);
    }, []);

    useEffect(() => {
        if (!status.nextUpdate) return;

        const tick = () => {
            const now = new Date();
            const next = new Date(status.nextUpdate!);
            const diff = next.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft("Em andamento...");
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}h ${minutes}m`);
            }
        };

        tick();
        const interval = setInterval(tick, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [status.nextUpdate]);

    return (
        <aside className="h-full flex flex-col border-r border-white/5 bg-[#050505]/50 backdrop-blur-xl relative overflow-hidden">
            {/* Decorational Glow */}
            <div className="absolute top-0 left-0 w-full h-64 bg-emerald-500/10 blur-[80px] pointer-events-none" />

            {/* Header / Logo */}
            <div className="relative h-24 flex items-center px-8">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute -inset-2 bg-emerald-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative p-2.5 bg-black/40 rounded-xl border border-white/10 shadow-xl">
                            <Activity className="w-6 h-6 text-emerald-400" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold tracking-tight text-white font-[family-name:var(--font-outfit)] leading-none">
                            Rift<span className="text-emerald-400">Score</span>
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase mt-0.5 ml-0.5">Community</span>
                    </div>
                </div>
                {/* Mobile Close Button */}
                <button onClick={onClose} className="lg:hidden absolute right-4 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-6 space-y-2 overflow-y-auto scrollbar-none">
                <div className="text-xs font-bold text-zinc-600 uppercase tracking-widest px-4 mb-4 font-[family-name:var(--font-outfit)]">
                    Menu Principal
                </div>
                {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                : "text-zinc-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
                            )}
                            <item.icon
                                className={`w-5 h-5 mr-3.5 transition-transform duration-300 ${isActive ? "text-black scale-110" : "text-zinc-500 group-hover:text-white group-hover:scale-110"
                                    }`}
                            />
                            <span className={`text-sm font-medium ${isActive ? "font-bold" : ""}`}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Status */}
            <div className="p-6">
                {/* Status Box */}
                <div className="bg-black/40 rounded-2xl p-5 border border-white/5 backdrop-blur-md hover:border-white/10 transition-colors group">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold group-hover:text-zinc-400 transition-colors">Atualização</span>
                        <div className="flex items-center gap-2">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                            <span className="text-[10px] text-emerald-500 font-bold">Online</span>
                        </div>
                    </div>

                    <div className="flex items-end justify-between">
                        <div>
                            <span className="text-xs text-zinc-500 block mb-0.5">Tempo Restante</span>
                            <span className="text-xl font-[family-name:var(--font-outfit)] text-white font-bold tracking-tight">{timeLeft || "--"}</span>
                        </div>
                    </div>

                    {status.lastUpdate && (
                        <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-zinc-600 flex justify-between items-center">
                            <span>Última:</span>
                            <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-zinc-400">
                                {new Date(status.lastUpdate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    )}
                </div>

                <div className="text-center mt-6">
                    <p className="text-[10px] text-zinc-600 font-medium">Rankings for Season 2026 • v2.3</p>
                </div>
            </div>
        </aside>
    );
}
