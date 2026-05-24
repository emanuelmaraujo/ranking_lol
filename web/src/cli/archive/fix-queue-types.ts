
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing MatchScore QueueTypes...');

    // Get all MatchScores
    const scores = await prisma.matchScore.findMany({
        include: { match: true }
    });

    let updated = 0;

    for (const score of scores) {
        // If score.queueType is wrong, we fix it.
        // We assume Match.queueType IS correct because ingest-batch saved it explicitly.

        // Wait, did ingest-batch save Match.queueType correctly?
        // Yes: if (match.info.queueId === 420) queueType = 'SOLO'; ... create matching Match record.

        if (score.match && score.match.queueType && score.queueType !== score.match.queueType) {
            await prisma.matchScore.update({
                where: { id: score.id },
                data: { queueType: score.match.queueType }
            });
            updated++;
        }
    }

    console.log(`✅ Fixed ${updated} MatchScores.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
