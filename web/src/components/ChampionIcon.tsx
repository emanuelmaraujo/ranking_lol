import { useState } from "react";
import { User } from "lucide-react";
import { CHAMPION_SPLASH_BASE } from "@/lib/constants";

interface ChampionIconProps {
    championName: string;
    className?: string;
    round?: boolean;
}

const DEFAULT_ICON = 29;

// Manual Mapping for known DDragon inconsistencies
// Most are handled by DDragon but Fiddlesticks is notoriously capitalized differently
const NAME_MAP: Record<string, string> = {
    'FiddleSticks': 'Fiddlesticks',
    'RenataGlass': 'Renata', // Sometimes needed
};

// We use the PROFILE_ICON logic but point to champion assets
// Note: constants.ts has CHAMPION_SPLASH_BASE, but for small icons (square),
// we usually use `cdn/ver/img/champion`. Let's assume we want Square icons for lists.
// Since constants.ts doesn't explicitly have CHAMPION_SQUARE_BASE, we'll construct it
// using the same versioning logic or reuse the existing pattern if possible.
// However, looking at constants.ts, it only has SPLASH and LOADING.
// Let's derive the square path from the known DDRAGON_VERSION import if possible,
// OR just use the common pattern.
import { DDRAGON_VERSION } from "@/lib/constants";
const CHAMPION_SQUARE_BASE = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion`;

export function ChampionIcon({ championName, className = "w-full h-full", round = false }: ChampionIconProps) {
    const [error, setError] = useState(false);

    // Normalize name
    let name = championName || 'Unknown';
    if (NAME_MAP[name]) name = NAME_MAP[name];

    // Fallback UI
    if (error || name === 'Unknown') {
        return (
            <div className={`${className} bg-zinc-800 flex items-center justify-center ${round ? 'rounded-full' : 'rounded-lg'}`}>
                <User className="text-zinc-500 w-1/2 h-1/2" />
            </div>
        );
    }

    return (
        <img
            src={`${CHAMPION_SQUARE_BASE}/${name}.png`}
            alt={name}
            className={`${className} ${round ? 'rounded-full' : 'rounded-xl'} object-cover`}
            onError={(e) => {
                // If standard name fails, try Capitalized first letter only as fallback?
                // Or just show error. DDragon is usually case-sensitive specific (PascalCase).
                // Example: 'wukong' -> 'MonkeyKing' (need map), 'missfortune' -> 'MissFortune'

                // Common Fixes for API data vs DDragon:
                // If it fails, we default to error state to show placeholder
                setError(true);
            }}
        />
    );
}
