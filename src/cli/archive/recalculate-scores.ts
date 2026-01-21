import 'dotenv/config';
import { RiotService } from '../services/riot.service';
import { calculateMatchScore, MatchDTO, Participant } from '../engine/scoring.engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extended interface removed to avoid conflicts
// interface IngestMatchDTO ...

// Helper: Canonical Duration
const getMatchDurationSeconds = (participants: Participant[]): number => {
    return Math.max(...participants.map(p => p.timePlayed ?? 0));
};

async function main() {
    const isDryRun = process.argv.includes('--dry-run');
    console.log(`Starting Recalculation Job ${isDryRun ? '(DRY RUN)' : '(LIVE UPDATE)'}...`);

    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) {
        console.error('Error: RIOT_API_KEY is not configured in .env');
        process.exit(1);
    }
    const riotService = new RiotService(apiKey);

    try {
        const scores = await prisma.matchScore.findMany({
            include: { player: true }
        });

        console.log(`Found ${scores.length} scores to recalculate.`);

        let updatedCount = 0;
        let unchangedCount = 0;
        let errors = 0;

        for (const score of scores) {
            try {
                // Fetch fresh data
                // console.log(`Fetching match ${score.matchId}...`); 
                // Commented out to reduce noise, usually we want to see progress though.
                process.stdout.write(`Processing ${score.player.gameName} - ${score.matchId}... `);

                const match = await riotService.getMatchDetails(score.matchId) as any;

                // FIX: Duration
                const correctDuration = getMatchDurationSeconds(match.info.participants);
                match.info.gameDuration = correctDuration;

                // Recalculate
                // Recalculate
                let newResult;
                let targetPuuid = score.playerId;

                try {
                    newResult = calculateMatchScore(targetPuuid, match as any);
                } catch (calcErr: any) {
                    if (calcErr.message === "Participant not found") {
                        // Fallback: Try to find by GameName
                        const pByName = match.info.participants.find((p: any) =>
                            p.riotIdGameName.toLowerCase() === score.player.gameName.toLowerCase()
                        );

                        if (pByName) {
                            // console.log(`\nNotice: PUUID mismatch for ${score.player.gameName}. Using PUUID from match context.`);
                            targetPuuid = pByName.puuid;
                            newResult = calculateMatchScore(targetPuuid, match as any);

                            // Optional: Schedule a fix for Player PUUID? 
                            // For now, we just solve the score recalculation.
                        } else {
                            console.error(`\nDEBUG: Participant not found for PUUID: ${score.playerId} AND name: ${score.player.gameName}`);
                            throw calcErr;
                        }
                    } else {
                        throw calcErr;
                    }
                }

                if (!newResult) {
                    console.log('Skipped (Engine returned null)');
                    errors++;
                    continue;
                }

                const newScore = newResult.matchScore;
                const oldScore = score.matchScore;

                // Get Champion Data
                const participant = match.info.participants.find((p: any) => p.puuid === targetPuuid);
                const championId = participant?.championId;
                const championName = participant?.championName;

                // Always update if we need to backfill champion data (which is true if we are running this now)
                // or if score changed.
                // Since we can't easily check if championId is missing (types), we update if !DryRun.

                const hasChanged = newScore !== oldScore;
                console.log(hasChanged ? `CHANGE: ${oldScore} -> ${newScore}` : `Score Unchanged (Updating Data)`);

                if (!isDryRun) {
                    await prisma.matchScore.update({
                        where: { id: score.id },
                        data: {
                            matchScore: newResult.matchScore,
                            performanceScore: newResult.breakdown.performance,
                            objectivesScore: newResult.breakdown.objectives,
                            disciplineScore: newResult.breakdown.discipline,
                            isVictory: newResult.breakdown.isVictory,
                            // New Fields Population
                            kills: participant?.kills ?? 0,
                            deaths: participant?.deaths ?? 0,
                            assists: participant?.assists ?? 0,
                            championId: championId,
                            championName: championName,
                            queueType: match.info.queueId === 440 ? 'FLEX' : 'SOLO', // Best guess backfill
                            lane: participant?.teamPosition ?? 'MIDDLE', // Backfill lane

                            metrics: {
                                ...newResult.metrics,
                                kills: participant?.kills ?? 0,
                                deaths: participant?.deaths ?? 0,
                                assists: participant?.assists ?? 0,
                                championName: championName,
                                championId: championId
                            } as any,
                            ratios: newResult.ratios
                        }
                    });
                }

                if (hasChanged) updatedCount++;
                else unchangedCount++; // Technically we updated DB rows, but score didn't change. 
                // Let's count as Updated for clarity? No, keep semantics.

            } catch (err: any) {
                console.error(`\nError processing ${score.matchId}: ${err.message}`);
                errors++;
            }
        }

        console.log('\n--- Recalculation Finished ---');
        console.log(`Updated: ${updatedCount}`);
        console.log(`Unchanged: ${unchangedCount}`);
        console.log(`Errors: ${errors}`);

    } catch (error: any) {
        console.error('Fatal Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
