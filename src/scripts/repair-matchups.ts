import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { RiotService } from '../services/riot.service';
import { calculateMatchScore, MatchDTO } from '../engine/scoring.engine';

const prisma = new PrismaClient();
const riotService = new RiotService(process.env.RIOT_API_KEY!);

async function repair() {
    console.log('🚀 Starting Matchup Data Repair Task...');

    const matchesToRepair = await prisma.matchScore.findMany({
        where: {
            OR: [
                { opponentChampionName: null },
                { opponentChampionName: 'Unknown' }
            ]
        },
        include: {
            match: true
        }
    });

    console.log(`Found ${matchesToRepair.length} matches to repair.`);

    let repaired = 0;
    let failed = 0;

    for (const score of matchesToRepair) {
        try {
            console.log(`[REPAIR] Fetching details for match ${score.matchId} (Player: ${score.playerId.substring(0, 8)})`);

            // Rate limit safety
            await new Promise(r => setTimeout(r, 100));

            const matchData = await riotService.getMatchDetails(score.matchId);

            // Re-calculate using the engine
            // The engine now populates the opponent info in its results? 
            // Actually, let's look at how calculateMatchScore works in scoring.engine.ts

            const result = calculateMatchScore(score.playerId, matchData as any);

            if (!result) {
                console.warn(`[REPAIR] Engine could not calculate score for ${score.matchId} (likely no lane opponent).`);
                failed++;
                continue;
            }

            // The result helper in scoring.engine doesn't directly return opponent name in the root, 
            // but we can extract it precisely as the engine does.
            // Let's identify the opponent here directly to be safe.

            const playerPart = matchData.info.participants.find((p: any) => p.puuid === score.playerId);
            const opponentPart = matchData.info.participants.find((p: any) =>
                p.teamPosition === playerPart.teamPosition && p.teamId !== playerPart.teamId
            );

            if (opponentPart) {
                // Prepare metrics (same logic as ingest-batch)
                // We mainly need the opponentChampionName column to be filled
                await prisma.matchScore.update({
                    where: { id: score.id },
                    data: {
                        opponentChampionId: opponentPart.championId,
                        opponentChampionName: opponentPart.championName,
                        // Optionally update metrics if they are missing these too
                        metrics: {
                            ...(score.metrics as any),
                            opponentChampionName: opponentPart.championName,
                            opponentChampionId: opponentPart.championId
                        }
                    }
                });
                repaired++;
                if (repaired % 10 === 0) console.log(`✅ Repaired ${repaired} matches...`);
            } else {
                console.warn(`[REPAIR] No opponent found for ${score.matchId} in position ${playerPart.teamPosition}`);
                failed++;
            }

        } catch (error: any) {
            console.error(`❌ Error repairing ${score.matchId}:`, error.message);
            failed++;
        }
    }

    console.log('\n--- Repair Task Finished ---');
    console.log(`Successfully Repaired: ${repaired}`);
    console.log(`Failed/Skipped: ${failed}`);
}

repair().finally(() => prisma.$disconnect());
