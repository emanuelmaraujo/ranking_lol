import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { RiotService } from '../services/riot.service';

const prisma = new PrismaClient();

export async function runSnapshot() {
    console.log('--- Starting Rank Snapshot ---');

    if (!process.env.RIOT_API_KEY) {
        console.error('Missing RIOT_API_KEY');
        process.exit(1);
    }

    const riotService = new RiotService(process.env.RIOT_API_KEY);
    const players = await prisma.player.findMany({ where: { isActive: true } });

    console.log(`Found ${players.length} active players.`);

    let created = 0;
    let errors = 0;

    for (const player of players) {
        try {
            console.log(`Processing ${player.gameName}...`);
            const leagueData = await riotService.getLeagueEntries(player.summonerId!); // Assuming summonerId exists, logic might need fetch if missing

            if (!leagueData) {
                console.log(`No league data for ${player.gameName}`);
                continue;
            }

            // Process SOLO and FLEX
            const queues = ['SOLO', 'FLEX'];

            for (const q of queues) {
                const entry = leagueData.find((e: any) =>
                    q === 'SOLO' ? e.queueType === 'RANKED_SOLO_5x5' : e.queueType === 'RANKED_FLEX_SR'
                );

                if (entry) {
                    await prisma.rankSnapshot.create({
                        data: {
                            playerId: player.puuid,
                            queueType: q,
                            tier: entry.tier,
                            rank: entry.rank,
                            lp: entry.leaguePoints
                        }
                    });
                    created++;
                } else {
                    // Create unranked snapshot? Or skip?
                    // Better to have explicit UNRANKED snapshot if we want to track them starting to play
                    // But for now, let's only track if they have data.
                }
            }

        } catch (error) {
            console.error(`Error processing ${player.gameName}:`, error);
            errors++;
        }
    }

    console.log(`--- Snapshot Complete ---`);
    console.log(`Snapshots Created: ${created}`);
    console.log(`Errors: ${errors}`);
}

if (require.main === module) {
    runSnapshot()
        .catch(e => console.error(e))
        .finally(async () => await prisma.$disconnect());
}
