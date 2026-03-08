"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Particle component for floating background particles
function Particle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
    return (
        <motion.div
            className="absolute rounded-full"
            style={{
                width: size,
                height: size,
                left: `${x}%`,
                top: `${y}%`,
                background: `radial-gradient(circle, rgba(16, 185, 129, ${0.3 + Math.random() * 0.4}) 0%, transparent 70%)`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
                opacity: [0, 0.8, 0.4, 0.8, 0],
                scale: [0, 1, 0.8, 1.1, 0],
                y: [0, -30, -15, -40, -60],
                x: [0, Math.random() * 20 - 10, Math.random() * 30 - 15],
            }}
            transition={{
                duration: 3.5,
                delay: delay,
                ease: "easeInOut",
            }}
        />
    );
}

// Orbiting ring element
function OrbitRing({ radius, duration, delay, opacity }: { radius: number; duration: number; delay: number; opacity: number }) {
    return (
        <motion.div
            className="absolute rounded-full border"
            style={{
                width: radius * 2,
                height: radius * 2,
                borderColor: `rgba(16, 185, 129, ${opacity})`,
                left: '50%',
                top: '50%',
                marginLeft: -radius,
                marginTop: -radius,
            }}
            initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
            animate={{
                opacity: [0, opacity, opacity * 0.5, opacity],
                scale: [0.8, 1, 1.02, 1],
                rotate: 360,
            }}
            transition={{
                duration: duration,
                delay: delay,
                ease: "linear",
                repeat: Infinity,
                repeatType: "loop",
            }}
        />
    );
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
    const [progress, setProgress] = useState(0);
    const [isExiting, setIsExiting] = useState(false);
    const hasTriggeredExit = useRef(false);

    // Generate particles
    const particles = useRef(
        Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: 30 + Math.random() * 40,
            y: 30 + Math.random() * 40,
            size: 2 + Math.random() * 4,
            delay: 0.3 + Math.random() * 2,
        }))
    ).current;

    // Smooth progress animation
    useEffect(() => {
        const startTime = Date.now();
        const totalDuration = 2800; // 2.8 seconds

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const rawProgress = Math.min(elapsed / totalDuration, 1);
            // Ease-out cubic for smooth deceleration
            const eased = 1 - Math.pow(1 - rawProgress, 3);
            setProgress(eased * 100);

            if (rawProgress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, []);

    // Exit trigger
    const triggerExit = useCallback(() => {
        if (hasTriggeredExit.current) return;
        hasTriggeredExit.current = true;
        setIsExiting(true);
        setTimeout(onComplete, 800);
    }, [onComplete]);

    useEffect(() => {
        const timer = setTimeout(triggerExit, 3200);
        return () => clearTimeout(timer);
    }, [triggerExit]);

    return (
        <AnimatePresence>
            {!isExiting ? (
                <motion.div
                    key="splash"
                    className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
                    style={{ background: '#050505' }}
                    exit={{
                        opacity: 0,
                        scale: 1.05,
                        filter: "blur(8px)",
                        transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
                    }}
                >
                    {/* Background Radial Glow */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5 }}
                    >
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
                            style={{
                                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 40%, transparent 70%)',
                            }}
                        />
                        {/* Secondary glow pulse */}
                        <motion.div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
                            style={{
                                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 60%)',
                            }}
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    </motion.div>

                    {/* Orbit Rings */}
                    <div className="absolute inset-0 pointer-events-none">
                        <OrbitRing radius={120} duration={8} delay={0.5} opacity={0.06} />
                        <OrbitRing radius={180} duration={12} delay={0.8} opacity={0.04} />
                        <OrbitRing radius={250} duration={16} delay={1.1} opacity={0.03} />
                    </div>

                    {/* Floating Particles */}
                    <div className="absolute inset-0 pointer-events-none">
                        {particles.map((p) => (
                            <Particle key={p.id} delay={p.delay} x={p.x} y={p.y} size={p.size} />
                        ))}
                    </div>

                    {/* Subtle grid lines */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none opacity-[0.02]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.02 }}
                        transition={{ delay: 0.5, duration: 2 }}
                        style={{
                            backgroundImage: `
                                linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)
                            `,
                            backgroundSize: '80px 80px',
                        }}
                    />

                    {/* Main Content */}
                    <div className="relative z-10 flex flex-col items-center">
                        {/* Logo Icon - Animated hexagon */}
                        <motion.div
                            className="mb-8 relative"
                            initial={{ opacity: 0, scale: 0.5, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="relative">
                                {/* Glow behind icon */}
                                <motion.div
                                    className="absolute -inset-4 rounded-2xl blur-xl"
                                    style={{ background: 'rgba(16, 185, 129, 0.15)' }}
                                    animate={{
                                        opacity: [0.3, 0.6, 0.3],
                                        scale: [0.95, 1.05, 0.95],
                                    }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <div className="relative p-4 bg-white/[0.03] rounded-2xl border border-emerald-500/20 backdrop-blur-sm shadow-2xl shadow-emerald-500/10">
                                    {/* SVG Logo Mark */}
                                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                        <motion.path
                                            d="M20 4L34 12V28L20 36L6 28V12L20 4Z"
                                            stroke="url(#logoGrad)"
                                            strokeWidth="1.5"
                                            fill="none"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 2, ease: "easeInOut", delay: 0.3 }}
                                        />
                                        <motion.path
                                            d="M20 10L28 14.5V23.5L20 28L12 23.5V14.5L20 10Z"
                                            fill="url(#logoGrad)"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 0.6, scale: 1 }}
                                            transition={{ duration: 0.8, delay: 1.2 }}
                                        />
                                        <defs>
                                            <linearGradient id="logoGrad" x1="6" y1="4" x2="34" y2="36">
                                                <stop stopColor="#34d399" />
                                                <stop offset="1" stopColor="#10b981" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                            </div>
                        </motion.div>

                        {/* Logo Text */}
                        <div className="flex items-baseline gap-0 mb-2">
                            {"Rift".split("").map((letter, i) => (
                                <motion.span
                                    key={`rift-${i}`}
                                    className="text-4xl md:text-5xl font-black tracking-tighter text-white"
                                    style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
                                    initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    transition={{
                                        duration: 0.6,
                                        delay: 0.4 + i * 0.08,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                >
                                    {letter}
                                </motion.span>
                            ))}
                            {"Score".split("").map((letter, i) => (
                                <motion.span
                                    key={`score-${i}`}
                                    className="text-4xl md:text-5xl font-black tracking-tighter"
                                    style={{
                                        fontFamily: 'var(--font-outfit), system-ui, sans-serif',
                                        background: 'linear-gradient(135deg, #34d399, #10b981, #059669)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}
                                    initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    transition={{
                                        duration: 0.6,
                                        delay: 0.7 + i * 0.08,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                >
                                    {letter}
                                </motion.span>
                            ))}
                        </div>

                        {/* Subtitle */}
                        <motion.span
                            className="text-[10px] md:text-xs text-zinc-500 font-bold tracking-[0.35em] uppercase mb-10"
                            style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
                            initial={{ opacity: 0, letterSpacing: "0.1em" }}
                            animate={{ opacity: 1, letterSpacing: "0.35em" }}
                            transition={{ duration: 1.2, delay: 1.2, ease: "easeOut" }}
                        >
                            Community
                        </motion.span>

                        {/* Progress Bar */}
                        <motion.div
                            className="relative w-48 md:w-64"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.4, duration: 0.5 }}
                        >
                            {/* Track */}
                            <div className="h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                                {/* Fill */}
                                <motion.div
                                    className="h-full rounded-full relative"
                                    style={{
                                        width: `${progress}%`,
                                        background: 'linear-gradient(90deg, #059669, #10b981, #34d399)',
                                    }}
                                >
                                    {/* Glow on tip */}
                                    <div
                                        className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                                        style={{
                                            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.8) 0%, transparent 70%)',
                                        }}
                                    />
                                </motion.div>
                            </div>

                            {/* Progress text */}
                            <motion.div
                                className="text-center mt-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.6, duration: 0.4 }}
                            >
                                <span className="text-[10px] text-zinc-600 font-medium tracking-wider uppercase"
                                    style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
                                >
                                    Carregando
                                </span>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Bottom Decoration Lines */}
                    <motion.div
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2, duration: 0.5 }}
                    >
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="rounded-full bg-emerald-500/30"
                                style={{ width: i === 1 ? 16 : 4, height: 2 }}
                                animate={{
                                    opacity: [0.3, 1, 0.3],
                                }}
                                transition={{
                                    duration: 1.5,
                                    delay: i * 0.2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
