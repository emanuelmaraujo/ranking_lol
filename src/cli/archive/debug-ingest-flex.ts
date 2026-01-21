
import 'dotenv/config';
import { RiotService } from '../services/riot.service';
import { PrismaClient } from '@prisma/client';
import { calculateMatchScore } from '../engine/scoring.engine';

const prisma = new PrismaClient();
const riotService = new RiotService(process.env.RIOT_API_KEY!);

async function main() {
    // Yi Espada Cega TRUE PUUID
    const puuid = "GOU_zQKbFXPFSjbn_TqaSaTm7Znc4D_4PYaOmMSnqHoQnJZbCN8bQ9FZCl0gGpULqjoHskAxqA";

    console.log('Fetching ALL matches (client-side filter)...');
    // Fetch 30 matches without queue filter
    const ids = await riotService.getRecentMatchIds(puuid, undefined, 30);
    console.log(`Found ${ids.length} matches. Filtering for Flex (440)...`);

    for (const matchId of ids) {
        console.log(`Processing ${matchId}...`);
        try {
            const match: any = await riotService.getMatchDetails(matchId);
            const queueId = match.info.queueId;
            console.log(`   QueueID: ${queueId}`);

            if (queueId !== 440) {
                console.log("   ⚠️ Not Flex!");
                continue;
            }

            // Save correct QueueType
            // ... (Simplified ingestion for debug)
            const queueType = 'FLEX';

            // Check DB
            const existing = await prisma.match.findUnique({ where: { matchId } });
            if (existing) {
                console.log(`   Existing DB Type: ${existing.queueType}`);
                if (existing.queueType !== 'FLEX') {
                    console.log('   🚨 MISMATCH! Updating DB to FLEX...');
                    await prisma.match.update({ where: { matchId }, data: { queueType: 'FLEX' } });
                    await prisma.matchScore.updateMany({ where: { matchId }, data: { queueType: 'FLEX' } });
                }
            } else {
                console.log(`   Creating new FLEX match/score...`);

                // Create Match
                await prisma.match.create({
                    data: {
                        matchId,
                        queueType: 'FLEX',
                        gameCreation: new Date(match.info.gameCreation),
                        gameDuration: match.info.gameDuration
                    }
                });

                // Create Score
                const result = calculateMatchScore(puuid, match);
                if (result) {
                    const pData = match.info.participants.find((p: any) => p.puuid === puuid);
                    await prisma.matchScore.create({
                        data: {
                            playerId: puuid,
                            matchId: matchId,
                            lane: 'MIDDLE', // generic
                            championId: pData.championId,
                            championName: pData.championName,
                            isVictory: result.breakdown.isVictory,
                            matchScore: result.matchScore,
                            performanceScore: result.breakdown.performance,
                            objectivesScore: result.breakdown.objectives,
                            disciplineScore: result.breakdown.discipline,
                            metrics: result.metrics as any,
                            ratios: result.ratios,
                            queueType: 'FLEX', // EXPLICIT
                            kills: pData.kills,
                            deaths: pData.deaths,
                            assists: pData.assists
                        }
                    });
                    console.log('   ✅ Score Created as FLEX');
                }
            }

        } catch (e: any) {
            console.error('FULL ERROR:', JSON.stringify(e.response?.data, null, 2));
            console.error(e.message);
        }
    }
}

main();
