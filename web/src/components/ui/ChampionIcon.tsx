import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DDRAGON_VERSION } from "@/lib/constants";
import { normalizeChampionName } from "@/lib/utils";

interface ChampionIconProps {
    championId: number;
    championName?: string;
    masteryLevel?: number;
    points?: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function ChampionIcon({ championId, championName, masteryLevel, points, size = 'md', className }: ChampionIconProps) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    // Mastery Border Colors
    const getMasteryColor = (level: number) => {
        if (level >= 7) return 'border-cyan-400 shadow-cyan-500/30';
        if (level === 6) return 'border-purple-400 shadow-purple-500/30';
        if (level === 5) return 'border-red-400 shadow-red-500/30';
        return 'border-gray-600';
    };

    const borderColor = masteryLevel ? getMasteryColor(masteryLevel) : 'border-gray-700';

    return (
        <div className={twMerge("relative group cursor-help", className)}>
            <img
                src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${normalizeChampionName(championName)}.png`}
                alt={championName || `Champion ${championId}`}
                className={clsx(
                    "rounded-full border-2 transition-all",
                    sizeClasses[size],
                    borderColor,
                    "group-hover:ring-2 ring-white/20"
                )}
            />
            {/* Tooltip for Mastery Points */}
            {(points !== undefined) && (
                <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none border border-white/10 shadow-xl transition-opacity z-10 w-auto text-center">
                    <span className="font-bold block text-xs">{championName}</span>
                    <span className="text-gray-400">{(points / 1000).toFixed(0)}k pts</span>
                </div>
            )}
            {/* Small Mastery Verification Badge */}
            {masteryLevel && masteryLevel >= 10 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-900 border border-cyan-400 flex items-center justify-center text-[8px] font-bold text-cyan-100">
                    {masteryLevel}
                </div>
            )}
        </div>
    );
}
