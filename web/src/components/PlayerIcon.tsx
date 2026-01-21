import { useState } from "react";
import { User } from "lucide-react";
import { PROFILE_ICON_BASE } from "@/lib/constants";

interface PlayerIconProps {
    profileIconId?: number;
    className?: string;
}

const DEFAULT_ICON = 29;

export function PlayerIcon({ profileIconId, className = "w-full h-full" }: PlayerIconProps) {
    const [error, setError] = useState(false);
    // Ensure id is a valid number, default to 29 if null/undefined
    const id = typeof profileIconId === 'number' ? profileIconId : DEFAULT_ICON;

    if (error) {
        return (
            <div className={`${className} bg-zinc-800 flex items-center justify-center`}>
                <User className="text-zinc-500 w-1/2 h-1/2" />
            </div>
        );
    }

    // Direct construction using the constant
    const src = `${PROFILE_ICON_BASE}/${id}.png`;

    return (
        <img
            src={src}
            alt=""
            className={className}
            onError={(e) => {
                // If it fails and it wasn't the default icon, try default
                if (id !== DEFAULT_ICON) {
                    e.currentTarget.src = `${PROFILE_ICON_BASE}/${DEFAULT_ICON}.png`;
                } else {
                    setError(true);
                }
            }}
        />
    );
}
