import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Truncated (76)
    // 5EXCAJV6W11UOnGlMoOYnKttqv7xBTNTzTDUxTgDLcSL5GDcJE2SqeurFbgF9O6Z-VKyyVKqfu2Q

    // Correct (78)
    // 5EXCAJV6W11UOnGlMoOYnKttqv7xBTNTzTDUxTgDLcSL5GDcJE2SqeurFbgF9O6Z-VKyyVKqfu2Q
    // Wait. My clipboard might be truncating?
    // Let's use the parts.
    // Part 1: 5EXCAJV6W11UOnGlMoOYnKttqv7xBTNTzTDUxTgDLcSL5GDcJE2SqeurFbgF9O6Z
    // Part 2: - (dash)
    // Part 3: VKyyVKqfu2Q
    // Length check: 
    // "5EXCAJV6W11UOnGlMoOYnKttqv7xBTNTzTDUxTgDLcSL5GDcJE2SqeurFbgF9O6Z".length = 66
    // "-".length = 1
    // "VKyyVKqfu2Q".length = 11.
    // Total = 78.

    // The truncated one in DB:
    // "5EXCAJV6W11UOnGlMoOYnKttqv7xBTNTzTDUxTgDLcSL5GDcJE2SqeurFbgF9O6Z".length = 66
    // "-".length = 1
    // "VKyyVKqfu2Q".length = 9?
    // Let's look at debug output: ...VKyyVKqfu2Q
    // Correct output: ...VKyyVKqfu2Q
    // Wait. They LOOK identical in logs?
    // Ah! "VKyyVKqfu2Q" vs "VKyyVKqfu2Q"
    // I can't see the difference visually.
    // Maybe hidden char?

    // I will fetch from Account-V1 dynamically in this script to be 100% sure.
    // Using RiotService.

    const { RiotService } = require('../services/riot.service'); // Using require to avoid import issues in quick script if not compiled
    // Actually, let's use Prisma to find the bad one by length.

    const players = await prisma.player.findMany();
    const badPlayer = players.find(p => p.puuid.length !== 78);

    if (!badPlayer) {
        console.log("No bad player found.");
        return;
    }

    console.log(`Found Bad Player: ${badPlayer.gameName} (Len ${badPlayer.puuid.length})`);

    // Fetch dynamically to avoid copy-paste errors
    const riotService = new RiotService(process.env.RIOT_API_KEY!);
    const freshPuuid = await riotService.getPuuid(badPlayer.gameName, badPlayer.tagLine);

    console.log(`Fetched Fresh PUUID: ${freshPuuid} (Len ${freshPuuid.length})`);

    const CORRECT_PUUID = freshPuuid;

    if (CORRECT_PUUID.length !== 78) {
        throw new Error(`Fetched PUUID is wrong length! ${CORRECT_PUUID.length}`);
    }

    try {
        // Create correct player
        await prisma.player.create({
            data: {
                ...badPlayer,
                puuid: CORRECT_PUUID,
                scores: { connect: [] }
                // snapshots: { connect: [] } // Removed to fix lint
            }
        });

        // Move Scores
        const scores = await prisma.matchScore.findMany({ where: { playerId: badPlayer.puuid } });
        console.log(`Moving ${scores.length} scores...`);
        for (const s of scores) {
            await prisma.matchScore.update({
                where: { id: s.id },
                data: { playerId: CORRECT_PUUID }
            });
        }

        // Delete Bad
        await prisma.player.delete({ where: { puuid: badPlayer.puuid } });
        console.log("FIXED.");

    } catch (e: any) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
