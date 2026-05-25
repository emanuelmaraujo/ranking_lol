import { NextRequest, NextResponse } from 'next/server';
import { RankingService } from '@/services/ranking.service';
import { SyncService } from '@/services/sync.service';
import { RiotService } from '@/services/riot.service';
import { prisma } from '@/lib/db';

const riotService = new RiotService(process.env.RIOT_API_KEY || '');
const rankingService = new RankingService(riotService);
const syncService = new SyncService();

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
};

// Handle OPTIONS (Pre-flight requests)
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// GET Request Handler
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ route: string[] }> }
) {
    const params = await context.params;
    const route = params.route;
    const { searchParams } = new URL(request.url);

    // Helper to format success JSON response with CORS
    const ok = (data: any, cacheControl?: string) => {
        const headers: Record<string, string> = { ...corsHeaders };
        if (cacheControl) {
            headers['Cache-Control'] = cacheControl;
        }
        return NextResponse.json(data, { headers });
    };

    // Helper for errors
    const err = (message: string, status = 500, details?: any) => {
        return NextResponse.json(
            { error: message, ...(details ? { details } : {}) },
            { status, headers: corsHeaders }
        );
    };

    try {

        // 1. Ranking General (/api/ranking/season)
        if (route[0] === 'ranking' && route[1] === 'season' && route.length === 2) {
            const queue = searchParams.get('queue') || 'SOLO';
            const limit = Number(searchParams.get('limit')) || 100;
            const startDate = searchParams.get('startDate');
            const endDate = searchParams.get('endDate');

            const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';
            const l = Number(limit) || 100;
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;

            const data = await rankingService.getSeasonRanking(q, l, start, end);
            return ok(data, 'no-store, no-cache, must-revalidate, proxy-revalidate');
        }

        // 2. Ranking By Elo (/api/ranking/season/by-elo)
        if (route[0] === 'ranking' && route[1] === 'season' && route[2] === 'by-elo') {
            const queue = searchParams.get('queue') || 'SOLO';
            const tier = searchParams.get('tier') || 'ALL';
            const limit = Number(searchParams.get('limit')) || 100;
            const startDate = searchParams.get('startDate');
            const endDate = searchParams.get('endDate');

            const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';
            const l = Number(limit) || 100;
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;

            const data = await rankingService.getRankingByElo(q, tier, l, start, end);
            return ok(data);
        }

        // 3. Player History (/api/player/:puuid/history)
        if (route[0] === 'player' && route[2] === 'history') {
            const puuid = route[1];
            const queue = searchParams.get('queue') || 'SOLO';
            const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';

            const data = await rankingService.getPlayerHistory(puuid, q);
            if (!data) return err('Player not found', 404);
            return ok(data);
        }

        // 4. PDL Gain Ranking (/api/ranking/pdl-gain)
        if (route[0] === 'ranking' && route[1] === 'pdl-gain') {
            const queue = searchParams.get('queue') || 'SOLO';
            const limit = Number(searchParams.get('limit')) || 20;
            const startDate = searchParams.get('startDate');

            const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';
            const l = Number(limit) || 20;
            const d = startDate ? new Date(startDate) : undefined;

            const data = await rankingService.getPdlGainRanking(q, l, d);
            return ok(data);
        }

        // 5. Highlights (/api/ranking/insights)
        if (route[0] === 'ranking' && route[1] === 'insights') {
            const queue = searchParams.get('queue') || 'SOLO';
            const startDate = searchParams.get('startDate');
            const endDate = searchParams.get('endDate');

            const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;

            const data = await rankingService.getHighlights(q, start, end);
            return ok(data);
        }

        // 6. Player Insights (/api/player/:puuid/insights)
        if (route[0] === 'player' && route[2] === 'insights') {
            const puuid = route[1];
            const queue = searchParams.get('queue') || 'SOLO';
            const page = Number(searchParams.get('page')) || 1;
            const limit = Number(searchParams.get('limit')) || 10;
            const sort = searchParams.get('sort') === 'asc' ? 'asc' : 'desc';
            const startDate = searchParams.get('startDate');
            const endDate = searchParams.get('endDate');

            const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;

            const data = await rankingService.getPlayerInsights(puuid, q, page, limit, sort, start, end);
            if (!data) {
                return ok({
                    stats: {
                        avgScore: '0',
                        winRate: '0%',
                        totalGames: 0,
                        avgKda: '0',
                        bestScore: 0,
                        worstScore: 0,
                    },
                    history: [],
                    insights: {
                        consistency: '-',
                        trend: '-',
                    },
                });
            }
            return ok(data);
        }

        // 7. Player Detailed Insights (/api/player/:puuid/detailed-insights)
        if (route[0] === 'player' && route[2] === 'detailed-insights') {
            const puuid = route[1];
            const queue = searchParams.get('queue');
            const startDate = searchParams.get('startDate');
            const endDate = searchParams.get('endDate');

            let q: 'SOLO' | 'FLEX' | 'BOTH' = 'SOLO';
            if (queue === 'FLEX') q = 'FLEX';
            if (queue === 'BOTH') q = 'BOTH';

            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;

            const data = await rankingService.getPlayerDetailedStats(puuid, q, start, end);
            if (!data) return err('No data found', 404);
            return ok(data);
        }

        // 8. PDL Evolution (/api/player/:puuid/pdl-evolution) - Core Feature-complete Add
        if (route[0] === 'player' && route[2] === 'pdl-evolution') {
            const puuid = route[1];
            const queue = searchParams.get('queue') || 'SOLO';
            const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';

            const data = await rankingService.getPdlEvolution(puuid, q);
            if (!data) return err('No snapshot found for player', 404);
            return ok(data);
        }

        // 9. System Init Status (/api/system/init-status)
        if (route[0] === 'system' && route[1] === 'init-status') {
            const data = await rankingService.getSystemInitStatus();
            return ok(data);
        }

        // 10. Status (/api/status)
        if (route[0] === 'status') {
            const data = await rankingService.getSystemStatus();
            return ok(data, 'no-store, no-cache, must-revalidate, proxy-revalidate');
        }

        // 11. Admin Job Status (/api/admin/jobs/:id)
        if (route[0] === 'admin' && route[1] === 'jobs') {
            const adminPwd = process.env.ADMIN_PASSWORD;
            const providedPwd = request.headers.get('x-admin-password');

            if (!adminPwd || providedPwd !== adminPwd) {
                return err('Unauthorized', 401);
            }

            const id = route[2];
            const job = syncService.getJob(id);

            if (!job) return err('Job not found', 404);
            return ok(job);
        }

        // 12. Hall of Fame (/api/insights/fame)
        if (route[0] === 'insights' && route[1] === 'fame') {
            const queue = searchParams.get('queue') || 'SOLO';
            const startDate = searchParams.get('startDate');
            const endDate = searchParams.get('endDate');

            const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;

            const data = await rankingService.getHallOfFame(q, start, end);
            return ok(data);
        }

        // 13. Hall of Shame (/api/insights/shame)
        if (route[0] === 'insights' && route[1] === 'shame') {
            const queue = searchParams.get('queue') || 'SOLO';
            const startDate = searchParams.get('startDate');
            const endDate = searchParams.get('endDate');

            const q = queue === 'FLEX' ? 'FLEX' : 'SOLO';
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;

            const data = await rankingService.getHallOfShame(q, start, end);
            return ok(data);
        }

        // 14. Community Relations (/api/community/relations)
        if (route[0] === 'community' && route[1] === 'relations') {
            const queue = searchParams.get('queue') || 'SOLO';
            const startDate = searchParams.get('startDate');
            const endDate = searchParams.get('endDate');

            let q: 'SOLO' | 'FLEX' | 'BOTH' = 'SOLO';
            if (queue === 'FLEX') q = 'FLEX';
            if (queue === 'BOTH') q = 'BOTH';

            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;

            const data = await rankingService.getCommunityRelations(q, start, end);
            return ok(data);
        }

        // 15. Global Matches (/api/matches)
        if (route[0] === 'matches' && route.length === 1) {
            const page = Number(searchParams.get('page')) || 1;
            const limit = Number(searchParams.get('limit')) || 20;
            const player = searchParams.get('player') || undefined;
            const lane = searchParams.get('lane') || undefined;
            const queue = searchParams.get('queue') || undefined;
            const champion = searchParams.get('champion') || undefined;

            const data = await rankingService.getGlobalMatches(page, limit, {
                playerPuuid: player,
                lane,
                queue,
                champion,
            });
            return ok(data);
        }

        // 16. Match Details (/api/matches/:matchId/details)
        if (route[0] === 'matches' && route[2] === 'details') {
            const matchId = route[1];
            const puuid = searchParams.get('puuid');

            if (!puuid) return err('Missing puuid', 400);

            const data = await rankingService.getMatchDetailsWithCache(matchId, puuid);
            if (!data) return err('Match/Player not found', 404);
            return ok(data);
        }

        // 17. Matches Highlights (/api/matches/highlights)
        if (route[0] === 'matches' && route[1] === 'highlights') {
            const period = (searchParams.get('period') as 'DAILY' | 'WEEKLY' | 'MONTHLY') || 'DAILY';
            const queue = searchParams.get('queue') || 'SOLO';

            const data = await rankingService.getGlobalHighlights(period, queue);
            return ok(data);
        }

        // No endpoint matched
        return err(`Endpoint GET /api/${route.join('/')} not found`, 404);
    } catch (e: any) {
        console.error(`[API ERROR] GET /api/${route.join('/')}:`, e);
        return err(e.message || 'Internal Server Error');
    }
}

// POST Request Handler
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ route: string[] }> }
) {
    const params = await context.params;
    const route = params.route;

    const ok = (data: any, status = 200) => {
        return NextResponse.json(data, { status, headers: corsHeaders });
    };

    const err = (message: string, status = 500, details?: any) => {
        return NextResponse.json(
            { error: message, ...(details ? { details } : {}) },
            { status, headers: corsHeaders }
        );
    };

    try {

        const body = await request.json().catch(() => ({}));

        // 1. Init Players (/api/system/init-players)
        if (route[0] === 'system' && route[1] === 'init-players') {
            const { players } = body;
            if (!players || !Array.isArray(players) || players.length === 0) {
                return err('Invalid players list', 400);
            }

            const result = await rankingService.bulkAddPlayers(players);
            const addedCount = result.success.length;

            if (addedCount === 0 && result.failed.length > 0) {
                return err('Failed to find players', 400, result);
            }

            return ok({
                ...result,
                message: 'Players added and synced successfully.'
            });
        }

        // 2. Add Player Admin (/api/players)
        if (route[0] === 'players' && route.length === 1) {
            const adminPwd = process.env.ADMIN_PASSWORD;
            const providedPwd = request.headers.get('x-admin-password');

            if (!adminPwd || providedPwd !== adminPwd) {
                return err('Unauthorized', 401);
            }

            const { gameName, tagLine } = body;
            if (!gameName || !tagLine) {
                return err('Missing gameName or tagLine', 400);
            }

            const account = await riotService.getAccountByRiotId(gameName, tagLine);
            let player = await prisma.player.upsert({
                where: { puuid: account.puuid },
                update: {
                    gameName: account.gameName,
                    tagLine: account.tagLine,
                    isActive: true,
                    updatedAt: new Date(),
                },
                create: {
                    puuid: account.puuid,
                    gameName: account.gameName,
                    tagLine: account.tagLine,
                    displayName: `${account.gameName} #${account.tagLine}`,
                    isActive: true,
                },
            });

            try {
                const summoner = await riotService.getSummonerByPuuid(player.puuid);
                player = await prisma.player.update({
                    where: { puuid: player.puuid },
                    data: {
                        profileIconId: summoner.profileIconId,
                        summonerLevel: summoner.summonerLevel,
                    },
                });
            } catch (e: any) {
                console.warn(`[API] Failed to sync summoner info: ${e.message}`);
            }

            try {
                const leagues = await riotService.getLeagueEntriesByPuuid(player.puuid);
                for (const entry of leagues) {
                    const queueMap: any = { RANKED_SOLO_5x5: 'SOLO', RANKED_FLEX_SR: 'FLEX' };
                    const qType = queueMap[entry.queueType];
                    if (!qType) continue;

                    await prisma.rankSnapshot.create({
                        data: {
                            playerId: player.puuid,
                            queueType: qType,
                            tier: entry.tier,
                            rank: entry.rank,
                            lp: entry.leaguePoints,
                        },
                    });

                    if (qType === 'SOLO') {
                        player = await prisma.player.update({
                            where: { puuid: player.puuid },
                            data: { tier: entry.tier, rank: entry.rank },
                        });
                    }
                }
            } catch (e: any) {
                console.warn(`[API] Failed to sync ranks: ${e.message}`);
            }

            // Sync Matches
            try {
                await syncService.manualUpdate([player.puuid], 50, 'BOTH');
            } catch (e: any) {
                console.error(`[API] Failed initial match sync: ${e.message}`);
            }

            return ok({ message: 'Player added and fully synced', player });
        }

        // 3. Manual Update (/api/admin/manual-update)
        if (route[0] === 'admin' && route[1] === 'manual-update') {
            const adminPwd = process.env.ADMIN_PASSWORD;
            const providedPwd = request.headers.get('x-admin-password');

            if (!adminPwd || providedPwd !== adminPwd) {
                return err('Unauthorized', 401);
            }

            const { puuids, matchCount = 5, queue = 'BOTH', start = 0 } = body;
            if (!puuids || puuids.length === 0) {
                return err('No players specified', 400);
            }

            try {
                console.log(`[API] Triggering Synchronous Manual Update for Vercel/Serverless compatibility...`);
                // Cap matchCount at 15 for Vercel Serverless compatibility to guarantee zero timeouts
                const cappedLimit = Math.min(Number(matchCount) || 5, 15);
                
                // Configure RiotService for fast-failing on 429 rate limit
                riotService.failFastOn429 = true;
                
                const result = await syncService.manualUpdate(puuids, cappedLimit, queue, Number(start) || 0, riotService);
                return ok({
                    message: 'Update complete (Sync)',
                    summary: result.summary || result
                });
            } catch (e: any) {
                console.error('[API] Manual Update Error:', e);
                const isRateLimit = e.response?.status === 429 || e.status === 429 || String(e.message).includes('429');
                return err(e.message || 'Internal Server Error', isRateLimit ? 429 : 500);
            }
        }

        // No endpoint matched
        return err(`Endpoint POST /api/${route.join('/')} not found`, 404);
    } catch (e: any) {
        console.error(`[API ERROR] POST /api/${route.join('/')}:`, e);
        return err(e.message || 'Internal Server Error');
    }
}
