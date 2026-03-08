import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { AppPreloader } from "@/components/layout/AppPreloader";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

import { Suspense } from "react";

import { QueueProvider } from "@/contexts/QueueContext";

export const metadata: Metadata = {
  title: "Ranking dos Crias",
  description: "Acompanhe o ranking da galera no League of Legends",
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${inter.variable} antialiased bg-[#050505] text-white font-sans selection:bg-emerald-500/30 selection:text-emerald-200`}
      >
        <AppPreloader />

        {/* Main App Content */}
        <QueueProvider>
          <AppShell>
            <Suspense fallback={null}>
              {children}
            </Suspense>
          </AppShell>
        </QueueProvider>
      </body>
    </html>
  );
}
