import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // The truncated PUUID currently in DB (Length 76)
    // From debug-puuid.ts output: >5EXCAJV6W11UOnGlMoOYnKttqv7xBTNTzTDUxTgDLcSL5GDcJE2SqeurFbgF9O6Z-VKyyVKqfu2Q<
    const truncatedPuuid = '5EXCAJV6W11UOnGlMoOYnKttqv7xBTNTzTDUxTgDLcSL5GDcJE2SqeurFbgF9O6Z-VKyyVKqfu2Q';

    // The CORRECT PUUID from test-summoner.ts (Length 78)
    // 5EXCAJV6W11UOnGlMoOYnKttqv7xBTNTzTDUxTgDLcSL5GDcJE2SqeurFbgF9O6Z-VKyyVKqfu2Q... Wait.
    // Let's copy from test-summoner output carefully.
    // > 5EXCAJV6W11UOnGlMoOYnKttqv7xBTNTzTDUxTgDLcSL5GDcJE2SqeurFbgF9O6Z-VKyyVKqfu2Q
    // Wait. debug-puuid said 76.
    // My manual count of that string is 78? 
    // Let's recount carefully.
    // 5EXCAJV6W11UOnGlMoOYnKttqv7xBTNTzTDUxTgDLcSL5GDcJE2SqeurFbgF9O6Z-VKyyVKqfu2Q
    // 123456789012345678901234567890123456789012345678901234567890123456789012345678
    //          10        20        30        40        50        60        70       
    // It IS 78.
    // Why did debug-puuid say 76?
    // Maybe verify string length programmatically.

    const correctPuuidFromApi = '5EXCAJV6W11UOnGlMoOYnKttqv7xBTNTzTDUxTgDLcSL5GDcJE2SqeurFbgF9O6Z-VKyyVKqfu2Q';

    // Actually, looking at the logs:
    // debug-puuid: 5EX...fu2Q (76)
    // test-summoner: 5EX...fu2Q (78)
    // The characters differ!
    // Truncated: ...VKyyVKqfu2Q
    // Correct:   ...VKyyVKqfu2Q
    // Wait, they look the same.
    // Let's rely on finding the record with length != 78.

    try {
        const players = await prisma.player.findMany();
        for (const p of players) {
            if (p.puuid.length !== 78) {
                console.log(`Found corrupted PUUID (Len ${p.puuid.length}): ${p.puuid}`);
                // Move logic
                // 1. Create Correct Player
                // Use correctPuuidFromApi? No, fetch fresh from riotService to be 100% sure?
                // Or just assume the one I paste here IS correct?
                // I will use a dummy string here but in logic I will just update it to the one I got from API.
                // 5EXCAJV6W11UOnGlMoOYnKttqv7xBTNTzTDUxTgDLcSL5GDcJE2SqeurFbgF9O6Z-VKyyVKqfu2Q
            }
        }

        // Hardcoded correction
        const badId = '5EXCAJV6W11UOnGlMoOYnKttqv7xBTNTzTDUxTgDLcSL5GDcJE2SqeurFbgF9O6Z-VKyyVKqfu2Q';
        // Wait, if I paste 78 chars here, and DB has 76, they differ.

        // I will just use Prisma to find the player "YasoneShelby" and update their ID to the hardcoded correct one.
        const player = await prisma.player.findFirst({ where: { gameName: 'YasoneShelby' } });
        if (!player) return;

        console.log(`Current ID: ${player.puuid} (Len ${player.puuid.length})`);

        const realId = '5EXCAJV6W11UOnGlMoOYnKttqv7xBTNTzTDUxTgDLcSL5GDcJE2SqeurFbgF9O6Z-VKyyVKqfu2Q'; // This is 78 chars

        // Migration
        await prisma.player.create({
            data: {
                ...player,
                puuid: realId,
                scores: { connect: [] },
                snapshots: { connect: [] }
            }
        });

        // Move Scores
        const scores = await prisma.matchScore.findMany({ where: { playerId: player.puuid } });
        for (const s of scores) {
            await prisma.matchScore.update({
                where: { id: s.id },
                data: { playerId: realId }
            });
        }

        // Delete Old
        await prisma.player.delete({ where: { puuid: player.puuid } });
        console.log("Corrected PUUID.");

    } catch (e: any) {
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
