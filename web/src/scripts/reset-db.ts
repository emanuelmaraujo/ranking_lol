
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🛑 DELETING ALL DATA...");

    // Order matters due to Foreign Keys
    await prisma.matchScore.deleteMany({});
    await prisma.match.deleteMany({});
    await prisma.pdlDailyStats.deleteMany({});
    await prisma.rankSnapshot.deleteMany({});
    await prisma.championMastery.deleteMany({});
    await prisma.player.deleteMany({});

    console.log("✅ Database Cleaned.");
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
