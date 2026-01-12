"use client";

import { useState, Suspense, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Menu } from "lucide-react";
import { FirstRunModal } from "../features/FirstRunModal";
import { getSystemInitStatus } from "@/lib/api";

export function AppShell({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showFirstRunModal, setShowFirstRunModal] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Initial System Check
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const status = await getSystemInitStatus();
                if (status.isFirstRun) {
                    setShowFirstRunModal(true);
                }
            } catch (error) {
                console.error("Failed to check system status", error);
            }
        };
        checkStatus();
    }, []);

    // Mobile toggle
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        setIsScrolled(scrollTop > 20);
    };

    return (
        <div className="flex h-screen bg-[#050505] text-gray-100 overflow-hidden">
            {/* First Run Modal */}
            <FirstRunModal
                isOpen={showFirstRunModal}
                onComplete={() => {
                    setShowFirstRunModal(false);
                    // Force reload to update UI with new players or just let the user navigate
                    window.location.reload();
                }}
            />

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Fixed Left */}
            <div className={`
                fixed lg:relative inset-y-0 left-0 z-50
                w-72 transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
                lg:translate-x-0 bg-black/20 lg:bg-transparent
            `}>
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">

                {/* Fixed Header (Overlay) */}
                <div className="absolute top-0 left-0 right-0 z-40">
                    <Suspense fallback={<div className="h-16 bg-black/20 backdrop-blur-md" />}>
                        {/* @ts-ignore - Topbar prop update pending */}
                        <Topbar onMenuClick={toggleSidebar} isScrolled={isScrolled} />
                    </Suspense>
                </div>

                {/* Scrollable Page Content Area */}
                <div
                    className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent scroll-smooth"
                    onScroll={handleScroll}
                >
                    <main className="pt-24 px-4 pb-6 md:pt-32 md:px-10 md:pb-10 lg:px-12 lg:pb-12 max-w-[1600px] mx-auto w-full">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
