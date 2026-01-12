"use client";

import { useState } from "react";
import { Crown } from "lucide-react";
import { PROFILE_ICON_BASE } from "@/lib/constants";

interface ProfileImageProps {
    profileIconId?: number | null;
    className?: string; // e.g. "w-10 h-10 rounded-full"
    alt?: string;
}

export function ProfileImage({ profileIconId, className = "w-10 h-10", alt = "Profile" }: ProfileImageProps) {
    const [error, setError] = useState(false);

    // If no ID, fallback immediately (or handle via parent)
    // But typically we show a default icon
    const hasId = profileIconId !== undefined && profileIconId !== null && profileIconId !== 0;

    if (!hasId || error) {
        return (
            <div className={`flex items-center justify-center bg-zinc-800 text-zinc-600 ${className}`}>
                <Crown className="w-1/2 h-1/2" />
            </div>
        );
    }

    return (
        <img
            src={`${PROFILE_ICON_BASE}/${profileIconId}.png`}
            alt={alt}
            className={`${className} object-cover`}
            onError={(e) => {
                // Prevent infinite loops if default also fails
                const target = e.currentTarget;
                target.onerror = null;
                target.src = `${PROFILE_ICON_BASE}/29.png`;
            }}
        />
    );
}
