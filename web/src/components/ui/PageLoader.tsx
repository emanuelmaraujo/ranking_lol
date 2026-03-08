"use client";

import { motion, AnimatePresence } from "framer-motion";

export function PageLoader({ isVisible = true }: { isVisible?: boolean }) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="page-loader"
                    className="fixed inset-0 z-[9998] flex items-center justify-center"
                    style={{ background: '#050505' }}
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                    }}
                >
                    {/* Subtle background glow */}
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 60%)',
                        }}
                    />

                    <div className="relative flex flex-col items-center gap-6">
                        {/* Spinning ring + Logo */}
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            {/* Outer ring */}
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    border: '2px solid transparent',
                                    borderTopColor: '#10b981',
                                    borderRightColor: 'rgba(16, 185, 129, 0.3)',
                                }}
                                animate={{ rotate: 360 }}
                                transition={{
                                    duration: 1.2,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                            />

                            {/* Inner ring (counter-rotate) */}
                            <motion.div
                                className="absolute rounded-full"
                                style={{
                                    width: '70%',
                                    height: '70%',
                                    border: '1.5px solid transparent',
                                    borderBottomColor: 'rgba(52, 211, 153, 0.5)',
                                    borderLeftColor: 'rgba(52, 211, 153, 0.15)',
                                }}
                                animate={{ rotate: -360 }}
                                transition={{
                                    duration: 1.8,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                            />

                            {/* Logo "RS" */}
                            <motion.div
                                className="relative z-10 flex items-baseline"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                            >
                                <span
                                    className="text-lg font-black text-white tracking-tighter"
                                    style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
                                >
                                    R
                                </span>
                                <span
                                    className="text-lg font-black tracking-tighter"
                                    style={{
                                        fontFamily: 'var(--font-outfit), system-ui, sans-serif',
                                        background: 'linear-gradient(135deg, #34d399, #10b981)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}
                                >
                                    S
                                </span>
                            </motion.div>

                            {/* Glow behind */}
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                                }}
                                animate={{
                                    scale: [1, 1.3, 1],
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            />
                        </div>

                        {/* Loading dots */}
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-1 h-1 rounded-full bg-emerald-500/60"
                                    animate={{
                                        opacity: [0.3, 1, 0.3],
                                        scale: [0.8, 1.2, 0.8],
                                    }}
                                    transition={{
                                        duration: 1,
                                        delay: i * 0.15,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
