import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getTheme } from '@/lib/tier-themes';
import { PROFILE_ICON_BASE } from '@/lib/constants';

interface PlayerAvatarProps {
    profileIconId?: number | null;
    summonerLevel?: number | null;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    ringColor?: string;
    tier?: string; // e.g. "GOLD", "CHALLENGER"
}

export function PlayerAvatar({ profileIconId, summonerLevel, className, size = 'md', ringColor, tier }: PlayerAvatarProps) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24'
    };

    const theme = getTheme(tier);
    // Priority: ringColor prop > Tier Style > Default
    // Note: theme.colors.border contains "border-xxxx". We might need to ensure it applies correctly.
    // Ideally we pass classes. If ringColor is raw color, we might need custom handling.
    // For now assuming ringColor is a class or we ignore it if using theme.

    // We will append theme.colors.border which usually is "border-yellow-600/30" etc.
    const finalBorder = ringColor || theme.colors.border;
    const finalShadow = theme.colors.glow;

    const iconUrl = profileIconId
        ? `${PROFILE_ICON_BASE}/${profileIconId}.png`
        : `${PROFILE_ICON_BASE}/29.png`;

    return (
        <div className={twMerge("relative inline-block", className)}>
            <img
                src={iconUrl}
                alt="Avatar"
                loading="lazy"
                onError={(e) => {
                    e.currentTarget.src = `${PROFILE_ICON_BASE}/29.png`;
                }}
                className={clsx(
                    "rounded-2xl object-cover border-2 transition-transform duration-500 hover:scale-110 hover:rotate-2",
                    sizeClasses[size],
                    finalBorder,
                    finalShadow
                )}
            />
            {summonerLevel && size !== 'sm' && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-[10px] text-white px-2 py-0.5 rounded-full border border-white/10 shadow-xl whitespace-nowrap z-10 backdrop-blur-md">
                    Lvl {summonerLevel}
                </div>
            )}
        </div>
    );
}
