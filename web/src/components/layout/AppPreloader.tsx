"use client";

import { useState, useEffect } from "react";
import { SplashScreen } from "../ui/SplashScreen";
import { PageLoader } from "../ui/PageLoader";

const SESSION_KEY = "riftscore_visited";

export function AppPreloader() {
    // We start with "splash" state for Server-Side Rendering to prevent a content flash 
    // on the first ever visit. The splash screen completely covers the UI.
    const [state, setState] = useState<"splash" | "pageload" | "ready">("splash");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const hasVisited = sessionStorage.getItem(SESSION_KEY);

        if (!hasVisited) {
            // It's actually the first visit, keep splash running
            setState("splash");
        } else {
            // Already visited this session, switch to pageload quickly
            setState("pageload");
            const timer = setTimeout(() => setState("ready"), 1200);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleSplashComplete = () => {
        sessionStorage.setItem(SESSION_KEY, "true");
        setState("ready");
    };

    // Before hydration finishes, we render the splash screen to cover the content
    if (!isMounted) {
        return <SplashScreen onComplete={() => { }} />;
    }

    if (state === "ready") return null;

    return (
        <>
            {state === "splash" && (
                <SplashScreen onComplete={handleSplashComplete} />
            )}

            {state === "pageload" && (
                <PageLoader isVisible={true} />
            )}
        </>
    );
}
