
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying Schema Changes...');

    // 1. Create a dummy player
    const puuid = 'TEST_SCHEMA_PUUID';
    await prisma.player.upsert({
        where: { puuid },
        create: { puuid, gameName: 'Test', tagLine: 'Schema', displayName: 'Test#Schema' },
        update: {}
    });

    // 2. Create a dummy match
    const matchId = 'TEST_SCHEMA_MATCH';
    await prisma.match.upsert({
        where: { matchId },
        create: {
            matchId,
            queueType: 'SOLO',
            gameCreation: new Date(),
            gameDuration: 1000
        },
        update: {}
    });

    // 3. Create MatchScore with NEW FIELDS
    console.log('Creating MatchScore with new fields...');
    try {
        await prisma.matchScore.deleteMany({ where: { playerId: puuid, matchId } });

        await prisma.matchScore.create({
            data: {
                playerId: puuid,
                matchId: matchId,
                lane: 'MIDDLE',
                championId: 100,
                championName: 'TestChamp',
                queueType: 'SOLO', // New field

                kills: 10,  // New field
                deaths: 2,  // New field
                assists: 5, // New field

                isVictory: true,
                matchScore: 100,
                performanceScore: 10,
                objectivesScore: 10,
                disciplineScore: 10,
                metrics: {},
                ratios: {}
            }
        });
        console.log('✅ MatchScore Created successfully.');
    } catch (e: any) {
        console.error('❌ Error creating MatchScore:', e.message);
        process.exit(1);
    }

    // 4. Query using NEW FIELDS
    console.log('Querying MatchScore using new fields...');
    const score = await prisma.matchScore.findFirst({
        where: {
            playerId: puuid,
            queueType: 'SOLO', // New filter
            kills: 10         // New filter
        }
    });

    if (score && score.championName === 'TestChamp' && score.queueType === 'SOLO') {
        console.log('✅ Query Verification Passed:');
        console.log(`   - KDA: ${score.kills}/${score.deaths}/${score.assists}`);
        console.log(`   - Champion: ${score.championName} (${score.championId})`);
        console.log(`   - Queue: ${score.queueType}`);
    } else {
        console.error('❌ Query Verification Failed', score);
        process.exit(1);
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
