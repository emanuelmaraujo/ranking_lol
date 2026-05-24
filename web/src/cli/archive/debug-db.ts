
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Inspecting Latest MatchScore ---');
    const score = await prisma.matchScore.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { match: true }
    });

    if (!score) {
        console.log('No MatchScores found.');
        return;
    }

    console.log(`Match ID: ${score.matchId}`);
    console.log(`Player ID: ${score.playerId}`);
    console.log(`Champion ID (Column):`, score.championId);
    console.log(`Champion Name (Column):`, score.championName);
    console.log(`Metrics (JSON):`);
    console.dir(score.metrics, { depth: null });

    console.log('--- Checking Participant Data from Riot API (Simulation) ---');
    // If we had raw data inspection, we'd do it here. 
    // For now, looking at what stored is enough.
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
