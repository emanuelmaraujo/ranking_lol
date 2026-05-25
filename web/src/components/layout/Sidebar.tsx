import { useEffect, useState, useRef } from "react";
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
    const [timeLeft, setTimeLeft] = useState<string>("Carregando...");
    const lastFetchRef = useRef<number>(0);

    const updateStatus = async (force = false) => {
        const now = Date.now();
        // Throttle to 30 seconds unless forced (initial render)
        if (!force && now - lastFetchRef.current < 30000) {
            return;
        }
        lastFetchRef.current = now;
        try {
            const newStatus = await getSystemStatus();
            // Only update state if something changed to avoid re-renders/loops
            setStatus(prev => {
                if (prev.lastUpdate !== newStatus.lastUpdate || prev.nextUpdate !== newStatus.nextUpdate) {
                    return newStatus;
                }
                return prev;
            });
        } catch (e) {
            console.error("Status check failed", e);
        }
    };

    // 1. Initial Load
    useEffect(() => {
        updateStatus(true);
    }, []);

    // 2. Smart Polling & Ticker
    useEffect(() => {
        const tick = () => {
            if (!status.nextUpdate) {
                // If we don't have a next update, treat as "checking" or "in progress"
                // and try to fetch one.
                setTimeLeft("Calculando...");
                updateStatus();
                return;
            }

            const now = new Date();
            const next = new Date(status.nextUpdate);
            const diff = next.getTime() - now.getTime();

            if (diff <= 0) {
                // TIME IS UP! We are in "Update Mode"
                setTimeLeft("Em andamento...");

                // Poll server vigorously (every tick? No, maybe regulate inside tick)
                // Since this runs every second (or minute), we can just call updateStatus()
                // But let's throttle it.
                if (now.getSeconds() % 10 === 0) { // Check server every 10 seconds when overdue
                    updateStatus();
                }
            } else {
                // COUNTDOWN MODE (mm:ss)
                // User requested removing hours format.
                const totalMinutes = Math.floor(diff / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                const secondsStr = seconds.toString().padStart(2, '0');

                setTimeLeft(`${totalMinutes}:${secondsStr}`);
            }
        };

        // Run tick immediately
        tick();

        // Run tick every second to keep UI snappy and catch the "0" moment accurately
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [status]); // Re-bind when status actually changes (new target time)

    return (
        <aside className="h-full w-full max-w-[240px] flex flex-col border-r border-white/5 bg-[#050505]/60 backdrop-blur-2xl relative overflow-hidden transition-all duration-300">
            {/* 1. TOP GLOW */}
            <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

            {/* 2. HEADER / LOGO */}
            <div className="relative h-20 flex items-center px-6 z-10 shrink-0">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative p-2 bg-white/5 rounded-lg border border-white/10 group-hover:border-emerald-500/30 transition-colors duration-500 shadow-xl backdrop-blur-md">
                            <Activity className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black tracking-tighter text-white font-[family-name:var(--font-outfit)] leading-none group-hover:tracking-normal transition-all duration-500">
                            Rift<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Score</span>
                        </span>
                        <span className="text-[9px] text-zinc-500 font-bold tracking-[0.2em] uppercase mt-0.5 pl-0.5 group-hover:text-emerald-500/60 transition-colors duration-500">
                            Community
                        </span>
                    </div>
                </div>
                {/* Mobile Close */}
                <button onClick={onClose} className="lg:hidden absolute right-4 p-1.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* 3. NAVIGATION */}
            <nav className="flex-1 py-2 px-3 space-y-1 overflow-y-auto scrollbar-none z-10">
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-4 mb-2 font-[family-name:var(--font-outfit)] opacity-60">
                    Menu Principal
                </div>
                {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={`
                                relative flex items-center px-3 py-2.5 rounded-lg transition-all duration-300 group overflow-hidden
                                ${isActive
                                    ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20"
                                    : "border border-transparent hover:bg-white/5 hover:border-white/5"
                                }
                            `}
                        >
                            {/* Active Glow Line */}
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500 shadow-[0_0_15px_#10b981]" />
                            )}

                            <item.icon
                                className={`
                                    w-4 h-4 mr-3 transition-all duration-300
                                    ${isActive
                                        ? "text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]"
                                        : "text-zinc-500 group-hover:text-zinc-200 group-hover:scale-110"
                                    }
                                `}
                            />
                            <span className={`
                                text-xs tracking-wide font-[family-name:var(--font-outfit)]
                                ${isActive ? "text-white font-bold" : "text-zinc-400 font-medium group-hover:text-zinc-200"}
                            `}>
                                {item.label}
                            </span>

                            {/* Hover Arrow */}
                            {!isActive && (
                                <div className="absolute right-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                    <div className="w-1 h-1 rounded-full bg-zinc-600" />
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* 4. FOOTER / STATUS WIDGET */}
            <div className="p-3 z-10 shrink-0">
                <div className="relative overflow-hidden rounded-xl bg-[#080808] border border-white/5 hover:border-emerald-500/20 transition-colors duration-500 group">
                    <div className="p-4 relative z-10">
                        {/* Status Header */}
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Próxima Att</h4>
                                <div className="flex items-center gap-1.5">
                                    <span className={`relative flex h-1.5 w-1.5 rounded-full ${timeLeft === "Em andamento..." ? "bg-amber-500" : "bg-emerald-500"}`}>
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${timeLeft === "Em andamento..." ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                                    </span>
                                    <span className={`text-[9px] font-bold ${timeLeft === "Em andamento..." ? "text-amber-500" : "text-emerald-500"}`}>
                                        {timeLeft === "Em andamento..." ? "PROCESSANDO" : "AGENDADO"}
                                    </span>
                                </div>
                            </div>

                            {/* Icon */}
                            <div className="p-1.5 rounded-md bg-white/5 text-zinc-500 group-hover:text-white transition-colors">
                                <Activity size={12} />
                            </div>
                        </div>

                        {/* Timer Big Text */}
                        <div className="text-xl font-black font-[family-name:var(--font-outfit)] tracking-tighter text-white tabular-nums">
                            {timeLeft || "--:--"}
                        </div>

                        {/* Last Update Micro Text */}
                        {status.lastUpdate && (
                            <div className="mt-2 pt-2 border-t border-white/5 flex justify-between text-[9px] font-medium text-zinc-500">
                                <span>Última:</span>
                                <span className="font-mono text-zinc-400">
                                    {new Date(status.lastUpdate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-center mt-4 mb-2 opacity-30 hover:opacity-100 transition-opacity duration-300">
                    <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-[0.2em] font-[family-name:var(--font-outfit)]">
                        RiftScore v2.3
                    </p>
                </div>
            </div>
        </aside>
    );
}
