
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Cleaning up Mock Snapshots...");

    // Delete snapshots created in the last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const result = await prisma.rankSnapshot.deleteMany({
        where: {
            createdAt: { gt: oneHourAgo }
        }
    });

    console.log(`Deleted ${result.count} mock snapshots.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
