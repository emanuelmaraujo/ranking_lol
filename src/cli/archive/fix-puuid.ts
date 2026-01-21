import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const oldPuuid = 'WocdT2Ncd-Sx96UtSJeUaU-sFKDBs3nU1AtS8moKjqCKP3ah0LayzWpDrQmn1AklAimZbSqMDnPuTQ';
    const newPuuid = '5EXCAJV6W11UOnGlMoOYnKttqv7xBTNTzTDUxTgDLcSL5GDcJE2SqeurFbgF9O6Z-VKyyVKqfu2Q';

    console.log(`Migrating ${oldPuuid} -> ${newPuuid}`);

    // Update Scores first? No, FK prevents.
    // Create new Player?
    // Update Player ID directly?
    // Prisma: update({ where: { puuid: oldPuuid }, data: { puuid: newPuuid } })
    // This works IF FKs are cascade or if we handle them.
    // Let's try direct update.

    try {
        // We probably need to temporarily disable FK checks or do it in order.
        // Actually, let's try creating a temp player, moving scores, then deleting old.

        // 1. Get Old Player Data
        const oldPlayer = await prisma.player.findUnique({ where: { puuid: oldPuuid } });
        if (!oldPlayer) {
            console.log("Old player not found, maybe already fixed?");
            return;
        }

        // 2. Create New Player (or upsert)
        await prisma.player.upsert({
            where: { puuid: newPuuid },
            create: {
                ...oldPlayer,
                puuid: newPuuid,
                scores: { connect: [] } // Don't move yet
            },
            update: {}
        });
        console.log("New player ensured.");

        // 3. Move Scores
        const scores = await prisma.matchScore.findMany({ where: { playerId: oldPuuid } });
        console.log(`Moving ${scores.length} scores...`);

        for (const s of scores) {
            await prisma.matchScore.update({
                where: { id: s.id },
                data: { playerId: newPuuid }
            });
        }

        // 4. Delete Old Player
        await prisma.player.delete({ where: { puuid: oldPuuid } });
        console.log("Old player deleted. Migration done.");

    } catch (e: any) {
        console.error("Migration Error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
