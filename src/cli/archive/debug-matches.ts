
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking Match Queue Types...');
    const matches = await prisma.match.findMany({ take: 20 });
    const scores = await prisma.matchScore.findMany({ take: 20, include: { match: true } });

    console.log('--- Matches ---');
    matches.forEach(m => console.log(`${m.matchId}: ${m.queueType}`));

    console.log('\n--- Scores ---');
    scores.forEach(s => console.log(`${s.matchId}: Score.QT=${s.queueType} vs Match.QT=${s.match.queueType}`));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
