
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const players = await prisma.player.count();
    const scores = await prisma.matchScore.count();
    const snapshots = await prisma.rankSnapshot.count();

    console.log('--- Database Counts ---');
    console.log(`Players: ${players}`);
    console.log(`MatchScores: ${scores}`);
    console.log(`RankSnapshots: ${snapshots}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
