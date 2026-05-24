
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Database Content ---');

    // Check Snapshots
    const snapshots = await prisma.rankSnapshot.findMany({ take: 5 });
    console.log(`RankSnapshots (Total: ${await prisma.rankSnapshot.count()}):`);
    console.dir(snapshots, { depth: null });

    // Check Masteries
    const masteries = await prisma.championMastery.findMany({ take: 5 });
    console.log(`\nChampionMasteries (Total: ${await prisma.championMastery.count()}):`);
    console.dir(masteries, { depth: null });

    // Check Player Relation
    const player = await prisma.player.findFirst({
        include: { masteries: true }
    });
    console.log(`\nSample Player Masteries Count: ${player?.masteries.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
