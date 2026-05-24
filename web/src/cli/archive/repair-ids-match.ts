
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { RiotService } from '../services/riot.service';

const prisma = new PrismaClient();
const riotService = new RiotService(process.env.RIOT_API_KEY!);

async function main() {
    console.log('🔧 Reparing Summoner IDs via Match-V5...');
    const players = await prisma.player.findMany();

    for (const p of players) {
        if (!p.summonerId) {
            console.log(`Processing ${p.gameName}...`);
            try {
                // 1. Get Match IDs (Solo)
                const ids = await riotService.getRecentMatchIds(p.puuid, 420, 1);
                if (ids.length === 0) {
                    // Try Flex
                    const idsFlex = await riotService.getRecentMatchIds(p.puuid, 440, 1);
                    if (idsFlex.length === 0) {
                        console.log("   ⚠️ No matches found. Cannot recover SummonerID.");
                        continue;
                    }
                    ids.push(idsFlex[0]);
                }

                const matchId = ids[0];
                console.log(`   -> Using Match ${matchId}`);

                // 2. Get Details
                const match = await riotService.getMatchDetails(matchId);

                // 3. Find Participant
                const participant = match.info.participants.find((part: any) => part.puuid === p.puuid);

                if (participant && participant.summonerId) {
                    await prisma.player.update({
                        where: { puuid: p.puuid },
                        data: { summonerId: participant.summonerId }
                    });
                    console.log(`   ✅ Fixed: ${participant.summonerId}`);
                } else {
                    console.error("   ❌ Player not found in match participants or no summonerId");
                }

            } catch (e: any) {
                console.error(`   ❌ Failed: ${e.message}`);
            }
        } else {
            console.log(`✓ ${p.gameName} OK`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
