import 'dotenv/config';
import { RiotService } from '../services/riot.service';
import { calculateMatchScore, MatchDTO, Participant } from '../engine/scoring.engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MAX_MATCHES_PER_PLAYER = 30;

// Extended interface for ingestion (same as in ingest-match.ts)
interface IngestMatchDTO extends MatchDTO {
    info: {
        gameDuration: number;
        gameCreation: number;
        queueId: number;
        participants: Participant[];
    };
}

import { SEASON_CONFIG } from '../config/season';

// Helper: Season Validation
const isInActiveSeason = (gameCreation: number): boolean => {
    // Configurable Season Dates (from src/config/season.ts)
    const seasonStart = new Date(`${SEASON_CONFIG.START_DATE}T00:00:00Z`).getTime();
    const seasonEnd = new Date(`${SEASON_CONFIG.END_DATE}T23:59:59Z`).getTime();
    return gameCreation >= seasonStart && gameCreation <= seasonEnd;
};

// Helper: Canonical Duration (from participants)
const getMatchDurationSeconds = (participants: Participant[]): number => {
    return Math.max(...participants.map(p => p.timePlayed ?? 0));
};

export async function ingestPlayers(
    players: any[], // Type Check skipped for brevity, should be Player[]
    matchLimit: number = 20,
    queueFilter: 'SOLO' | 'FLEX' | 'BOTH' = 'BOTH',
    riotService?: RiotService
) {
    if (!riotService) {
        const apiKey = process.env.RIOT_API_KEY;
        if (!apiKey) throw new Error('RIOT_API_KEY is not configured');
        riotService = new RiotService(apiKey);
    }
    
    console.log(`Starting Batch Ingestion for ${players.length} players. Limit: ${matchLimit}. Queue: ${queueFilter}`);

    // Summary Counters
    const summary = {
        playersProcessed: 0,
        matchesFound: 0,
        matchesSaved: 0,
        matchesAlreadyProcessed: 0,
        matchesIgnored: 0,
        errors: 0
    };

    // 2. Sequential Player Loop
    for (const player of players) {
        summary.playersProcessed++;
        const logPrefix = `[Player ${player.gameName}]`;
        console.log(`${logPrefix} Processing...`);

        try {
            let targetIds: string[] = [];

            if (queueFilter === 'SOLO' || queueFilter === 'BOTH') {
                const soloIds = await riotService.getRecentMatchIds(player.puuid, 420, matchLimit);
                targetIds.push(...soloIds);
            }
            if (queueFilter === 'FLEX' || queueFilter === 'BOTH') {
                const flexIds = await riotService.getRecentMatchIds(player.puuid, 440, matchLimit);
                targetIds.push(...flexIds);
            }

            // Dedup
            targetIds = Array.from(new Set(targetIds));

            summary.matchesFound += targetIds.length;

            // 3. Sequential Match Loop
            for (const matchId of targetIds) {
                const matchPrefix = `${logPrefix} [Match ${matchId}]`;

                // EFFICIENCY: Check if we already have this match for this player
                const existingScore = await prisma.matchScore.findUnique({
                    where: {
                        playerId_matchId: {
                            playerId: player.puuid,
                            matchId: matchId
                        }
                    }
                });

                if (existingScore) {
                    // FIX: Only skip if we have valid KDA (repair mode)
                    const hasKda = (existingScore.kills || 0) + (existingScore.deaths || 0) + (existingScore.assists || 0) > 0;
                    if (hasKda) {
                        summary.matchesAlreadyProcessed++;
                        continue;
                    }
                }

                try {
                    // Fetch Details
                    const match = await riotService.getMatchDetails(matchId) as unknown as IngestMatchDTO;

                    // --- CHECKS ---
                    const matchDate = new Date(match.info.gameCreation);
                    // 1. Season Check
                    if (!isInActiveSeason(match.info.gameCreation)) {
                        console.log(`${matchPrefix} ignored (outside season: ${matchDate.toISOString()})`);
                        summary.matchesIgnored++;
                        continue;
                    }

                    const correctDuration = getMatchDurationSeconds(match.info.participants);

                    // 2. Duration Check
                    if (correctDuration < 600) {
                        console.log(`${matchPrefix} ignored (duration < 10min)`);
                        summary.matchesIgnored++;
                        continue;
                    }

                    // PATCH: Update match object with correct duration so Engine sees it too
                    match.info.gameDuration = correctDuration;

                    // Calculate Score
                    const result = calculateMatchScore(player.puuid, match);

                    if (!result) {
                        console.log(`${matchPrefix} ignored (engine returned null - likely no lane opponent)`);
                        summary.matchesIgnored++;
                        continue;
                    }

                    // --- PERSISTENCE ---

                    // Determine Queue Type explicitly
                    let queueType = 'OTHER';
                    if (match.info.queueId === 420) queueType = 'SOLO';
                    else if (match.info.queueId === 440) queueType = 'FLEX';
                    
                    // Double check queue filter (if strict)
                    if (queueFilter !== 'BOTH' && queueType !== queueFilter) {
                         // This might happen if 'getRecentMatchIds' returns generic ids or cross-queue? 
                         // Riot Match-V5 usually respects queue param. Safe to proceed.
                    }

                    // Upsert Match
                    await prisma.match.upsert({
                        where: { matchId: matchId },
                        update: {},
                        create: {
                            matchId: matchId,
                            queueType: queueType,
                            gameCreation: new Date(match.info.gameCreation),
                            gameDuration: correctDuration
                        }
                    });

                    // Derive Lane (Reuse existing logic)
                    const pData = match.info.participants.find(p => p.puuid === player.puuid);
                    if (!pData) throw new Error("Participant missing in match data");

                    const validLanes = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
                    let lane = pData.teamPosition;

                    if (!validLanes.includes(lane)) {
                        lane = (pData as any).individualPosition;
                    }
                    if (!validLanes.includes(lane)) lane = 'MIDDLE'; 

                    // Identify Opponent Champion
                    const opponentPart = match.info.participants.find(p =>
                        p.teamPosition === pData.teamPosition && p.teamId !== pData.teamId
                    );

                    // Prepare Data
                    const scoreData = {
                        playerId: player.puuid,
                        matchId: matchId,
                        lane: lane,
                        championId: pData.championId,
                        championName: pData.championName,
                        opponentChampionId: opponentPart?.championId || null,
                        opponentChampionName: opponentPart?.championName || 'Unknown',
                        queueType: queueType, 
                        isVictory: result.breakdown.isVictory,
                        matchScore: result.matchScore,
                        performanceScore: result.breakdown.performance,
                        objectivesScore: result.breakdown.objectives,
                        disciplineScore: result.breakdown.discipline,
                        kills: pData.kills,
                        deaths: pData.deaths,
                        assists: pData.assists,
                        metrics: {
                            ...result.metrics,
                            kills: pData.kills,
                            deaths: pData.deaths,
                            assists: pData.assists,
                            championName: pData.championName,
                            championId: pData.championId,
                            pentaKills: (pData as any).pentaKills || 0,
                            quadraKills: (pData as any).quadraKills || 0,
                            totalDamage: pData.totalDamageDealtToChampions || 0,
                            totalMinions: pData.totalMinionsKilled + pData.neutralMinionsKilled,
                            visionScore: pData.visionScore || 0,
                            goldEarned: pData.goldEarned || 0,
                            totalTimePlayed: pData.timePlayed || 0,
                            totalTimeSpentDead: pData.totalTimeSpentDead || 0, 
                            damageDealtToBuildings: pData.damageDealtToBuildings || 0, 
                            turretPlatesTaken: (pData as any).challenges?.turretPlatesTaken || 0,
                            firstBloodKill: (pData as any).firstBloodKill || false,
                            challenges: {
                                goldDiffAt15: pData.challenges?.goldDiffAt15 || 0,
                                xpDiffAt15: pData.challenges?.xpDiffAt15 || 0,
                                killParticipation: pData.challenges?.killParticipation || 0,
                                dragonTakedowns: pData.challenges?.dragonTakedowns || 0,
                                baronTakedowns: pData.challenges?.baronTakedowns || 0,
                                riftHeraldTakedowns: pData.challenges?.riftHeraldTakedowns || 0,
                                teamDamagePercentage: pData.challenges?.teamDamagePercentage || 0,
                                soloKills: pData.challenges?.soloKills || 0,
                                saveAllyFromDeath: pData.challenges?.saveAllyFromDeath || 0,
                                enemyJungleMonsterKills: pData.challenges?.enemyJungleMonsterKills || 0,
                                controlWardsPlaced: pData.challenges?.controlWardsPlaced || 0,
                                perfectGame: pData.challenges?.perfectGame || 0
                            }
                        } as any,
                        ratios: result.ratios
                    };

                    // 3. UPSERT MatchScore
                    await prisma.matchScore.upsert({
                        where: {
                            playerId_matchId: {
                                playerId: player.puuid,
                                matchId: matchId
                            }
                        },
                        update: {
                            queueType: queueType,
                            lane: lane,
                            championId: pData.championId,
                            championName: pData.championName,
                            opponentChampionId: opponentPart?.championId || null,
                            opponentChampionName: opponentPart?.championName || 'Unknown',
                            isVictory: result.breakdown.isVictory,
                            matchScore: result.matchScore,
                            performanceScore: result.breakdown.performance,
                            objectivesScore: result.breakdown.objectives,
                            disciplineScore: result.breakdown.discipline,
                            kills: pData.kills,
                            deaths: pData.deaths,
                            assists: pData.assists,
                            metrics: scoreData.metrics,
                            ratios: result.ratios
                        },
                        create: scoreData
                    });

                    console.log(`${matchPrefix} saved`);
                    summary.matchesSaved++;

                } catch (matchError: any) {
                    console.error(`${matchPrefix} Error: ${matchError.message}`);
                    summary.errors++;
                }
            } // End Match Loop

        } catch (playerError: any) {
            console.error(`${logPrefix} Failed to process player: ${playerError.message}`);
            summary.errors++;
        }
    } // End Player Loop
    
    return summary;
}

export async function runIngestBatch() {
    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) {
        console.error('Error: RIOT_API_KEY is not configured in .env');
        process.exit(1);
    }
    
    console.log('Starting Batch Ingestion Job...');
    
    try {
        const players = await prisma.player.findMany({
            where: { isActive: true }
        });
        
        const limitEnv = process.env.MATCH_LIMIT ? parseInt(process.env.MATCH_LIMIT) : 20; 
        const limit = Number.isNaN(limitEnv) ? 20 : limitEnv;

        const summary = await ingestPlayers(players, limit, 'BOTH');

        console.log('\n--- Batch Job Finished ---');
        console.log(JSON.stringify(summary, null, 2));

    } catch (error: any) {
        console.error('Fatal Job Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    runIngestBatch();
}
