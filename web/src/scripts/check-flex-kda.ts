
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Flex KDA Data...");

    // Find up to 5 Flex scores
    const flexScores = await prisma.matchScore.findMany({
        where: {
            queueType: 'FLEX'
        },
        take: 5,
        orderBy: {
            match: { gameCreation: 'desc' }
        },
        include: {
            match: true
        }
    });

    console.log(`Found ${flexScores.length} Flex Scores.`);

    flexScores.forEach(s => {
        console.log(`Match ${s.matchId.split('_')[1]} | KDA: ${s.kills}/${s.deaths}/${s.assists} | Metrics:`, s.metrics);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
