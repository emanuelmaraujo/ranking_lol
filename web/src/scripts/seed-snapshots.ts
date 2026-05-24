import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Seeding Mock Snapshots ---');

    const players = await prisma.player.findMany({ where: { isActive: true } });
    console.log(`Found ${players.length} active players.`);

    // Helper to create snapshot
    const createSnap = async (puuid: string, queue: string, tier: string, rank: string, lp: number, date: Date) => {
        await prisma.rankSnapshot.create({
            data: {
                playerId: puuid,
                queueType: queue,
                tier,
                rank,
                lp,
                createdAt: date
            }
        });
    };

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const now = new Date();

    for (const player of players) {
        console.log(`Seeding for ${player.gameName}...`);

        // Case 1: Big climber (+52 PDL)
        if (player.gameName.includes('Yasone')) {
            // SOLO
            await createSnap(player.puuid, 'SOLO', 'EMERALD', 'IV', 20, weekAgo);
            await createSnap(player.puuid, 'SOLO', 'EMERALD', 'IV', 72, now);
            // FLEX (New!)
            await createSnap(player.puuid, 'FLEX', 'PLATINUM', 'II', 10, weekAgo);
            await createSnap(player.puuid, 'FLEX', 'PLATINUM', 'II', 45, now);
            console.log(' - Seeded CLIMBER (Solo & Flex)');
        }
        // Case 2: Dropper (-15 PDL)
        else if (player.gameName.includes('Dante')) {
            await createSnap(player.puuid, 'SOLO', 'PLATINUM', 'I', 90, weekAgo);
            await createSnap(player.puuid, 'SOLO', 'PLATINUM', 'I', 75, now);

            await createSnap(player.puuid, 'FLEX', 'GOLD', 'I', 50, weekAgo);
            await createSnap(player.puuid, 'FLEX', 'GOLD', 'I', 80, now); // Climber in Flex?
            console.log(' - Seeded DROPPER (Solo) / CLIMBER (Flex)');
        }
        // Case 3: Neutral (0 PDL)
        else {
            await createSnap(player.puuid, 'SOLO', 'GOLD', 'II', 50, weekAgo);
            await createSnap(player.puuid, 'SOLO', 'GOLD', 'II', 50, now);

            await createSnap(player.puuid, 'FLEX', 'SILVER', 'I', 20, weekAgo);
            await createSnap(player.puuid, 'FLEX', 'SILVER', 'I', 20, now);
            console.log(' - Seeded NEUTRAL');
        }
    }

    console.log('--- Seeding Complete ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
