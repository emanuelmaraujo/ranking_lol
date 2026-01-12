'use client';

import { useEffect, useState } from 'react';
import {
  getSeasonRanking,
  getHighlights,
  getPdlGainRanking,
  getHallOfFame,
  getHallOfShame,
  getPlayerInsights,
  RankingEntry,
  PeriodHighlights,
  PdlGainEntry,
  HallOfFameData,
  HallOfShameData,
  HighlightPlayer
} from '@/lib/api';
import { useQueue } from '@/contexts/QueueContext';

// Components
import { HeroSection } from '@/components/home/HeroSection';
import { WeeklySpotlight } from '@/components/home/WeeklySpotlight';
import { HighlightsCarousel } from '@/components/home/HighlightsCarousel';
import { WeeklyTrends } from '@/components/home/WeeklyTrends'; // Re-introduced
import { Ticker } from '@/components/home/Ticker';
import { getDateRange } from '@/lib/date-utils';

type HomeData = {
  ranking: RankingEntry[];
  highlights: PeriodHighlights | null;
  trends: PdlGainEntry[];
  fame: HallOfFameData | null;
  shame: HallOfShameData | null;
  tickerData: PdlGainEntry[]; // Special combined list for ticker
};

export default function Home() {
  const { queueType } = useQueue();

  const [data, setData] = useState<HomeData>({
    ranking: [],
    highlights: null,
    trends: [],
    fame: null,
    shame: null,
    tickerData: []
  });
  const [loading, setLoading] = useState(true);

  // BAGRE Score State
  const [bagreScore, setBagreScore] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch Primary Data based on selected Queue
        const currentQueue = queueType || 'SOLO';

        const [rankingRes, highlightsRes, trendsRes, fameRes, shameRes] = await Promise.allSettled([
          getSeasonRanking(currentQueue, 5),
          getHighlights(currentQueue, getDateRange('WEEKLY')),
          getPdlGainRanking(currentQueue, 50, getDateRange('WEEKLY')?.start),
          getHallOfFame(currentQueue, getDateRange('WEEKLY')),
          getHallOfShame(currentQueue, getDateRange('WEEKLY'))
        ]);

        // FETCH SECONDARY DATA for Ticker (The OTHER queue)
        let otherQueueTrends: PdlGainEntry[] = [];
        const otherQueue = currentQueue === 'SOLO' ? 'FLEX' : 'SOLO';

        try {
          otherQueueTrends = await getPdlGainRanking(otherQueue, 30, getDateRange('WEEKLY')?.start);
        } catch (e) {
          console.warn(`Failed to fetch ${otherQueue} trends`, e);
        }

        const primaryTrends = trendsRes.status === 'fulfilled' ? trendsRes.value : [];

        // Combine and format trends for Ticker
        const combinedTicker = [
          ...primaryTrends.map(t => ({ ...t, queueType: currentQueue })),
          ...otherQueueTrends.map(t => ({ ...t, queueType: otherQueue }))
        ].sort((a, b) => b.pdlGain - a.pdlGain);

        setData({
          ranking: rankingRes.status === 'fulfilled' ? rankingRes.value : [],
          highlights: highlightsRes.status === 'fulfilled' ? highlightsRes.value : null,
          trends: primaryTrends,
          fame: fameRes.status === 'fulfilled' ? fameRes.value : null,
          shame: shameRes.status === 'fulfilled' ? shameRes.value : null,
          tickerData: combinedTicker as any
        });
      } catch (e) {
        console.error("Data error", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [queueType]);

  // --- Derived NARRATIVE Logic ---
  const top1Player = data.ranking.length > 0 ? data.ranking[0] : null;
  const top1Delta = top1Player ? data.trends.find(t => t.puuid === top1Player.puuid)?.pdlGain : null;

  const mvpPlayer = data.highlights?.mvp || null;

  // BAGRE LOGIC (Improved)
  // 1. First check API specific shame (Solo Doador matches Bagre vibe)
  let antiMvpPlayer: HighlightPlayer | null = data.shame?.soloDoador || null;

  // Fallback to biggest loser if no specific shame entry
  if (!antiMvpPlayer) {
    const sortedTrends = [...data.trends].sort((a, b) => a.pdlGain - b.pdlGain);
    const biggestLoser = sortedTrends.length > 0 && sortedTrends[0].pdlGain < -15 ? sortedTrends[0] : null;

    if (biggestLoser) {
      antiMvpPlayer = {
        puuid: biggestLoser.puuid,
        gameName: biggestLoser.gameName,
        tagLine: biggestLoser.tagLine,
        profileIconId: biggestLoser.profileIconId,
        value: `${biggestLoser.pdlGain} PDL`, // Fallback value
        label: 'Derreteu na semana',
        championName: 'Troll Pick?',
        tier: biggestLoser.tier
      };
    }
  }

  // 2. Fetch AvgScore for Bagre specifically
  useEffect(() => {
    async function fetchBagreStats() {
      if (antiMvpPlayer && !bagreScore) {
        try {
          const insights = await getPlayerInsights(antiMvpPlayer.puuid, queueType || 'SOLO');
          if (insights?.stats?.avgScore) {
            setBagreScore(insights.stats.avgScore);
          }
        } catch (e) {
          console.warn("Could not fetch bagre score", e);
        }
      }
    }
    fetchBagreStats();
  }, [antiMvpPlayer?.puuid, queueType]); // Ensure dependencies are correct

  // Apply the corrected score if available
  if (antiMvpPlayer && bagreScore) {
    antiMvpPlayer = {
      ...antiMvpPlayer,
      value: bagreScore
    };
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 rounded-full animate-spin border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="bg-[#050505] text-white selection:bg-emerald-500/30 w-full font-sans relative pb-32 overflow-hidden">

      {/* 0. GLOBAL ATMOSPHERE & DECORATIONS */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Deep Gradient Base - Less Pitch Black */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080a09] via-[#050505] to-[#020202]" />

        {/* Ambient Spots - Subtle Color */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-900/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* 1. TICKER (Fixed under Topbar) */}
      <div className="fixed top-24 left-0 right-0 z-30 transition-all duration-300">
        <Ticker trends={data.tickerData} />
      </div>

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 md:px-8 mt-16">

        {/* Spacer for aesthetics since header is gone */}
        <div className="h-10" />

        {/* 2. HERO SECTION */}
        <HeroSection player={top1Player} pdlDelta={top1Delta} />

        {/* 3. WEEKLY SPOTLIGHT (Heaven & Hell) */}
        <WeeklySpotlight mvp={mvpPlayer} antiMvp={antiMvpPlayer} />

        {/* 4. STORIES & CLIMBERS GRID */}
        <div className="mb-24">

          {/* NEW: WEEKLY TRENDS (Restored PDL Part) */}
          <div className="mb-12">
            <WeeklyTrends trends={data.trends} />
          </div>

          {/* Highlights (Stories) - Full Width */}
          <div className="w-full">
            <HighlightsCarousel fame={data.fame} shame={data.shame} trends={data.trends} ranking={data.ranking} highlights={data.highlights} />
          </div>

        </div>

      </div>
    </div>
  );
}
