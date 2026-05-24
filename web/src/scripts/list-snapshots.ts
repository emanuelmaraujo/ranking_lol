
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Listing Rank Snapshots...");

    const snaps = await prisma.rankSnapshot.findMany({
        orderBy: { createdAt: 'desc' },
        include: { player: { select: { gameName: true } } }
    });

    console.log(`Found ${snaps.length} snapshots.`);
    snaps.forEach(s => {
        console.log(`[${s.createdAt.toISOString()}] ${s.player.gameName} - ${s.queueType}: ${s.tier} ${s.rank} ${s.lp} LP`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
