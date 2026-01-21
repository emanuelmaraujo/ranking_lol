
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { RiotService } from '../services/riot.service';

const prisma = new PrismaClient();
const riotService = new RiotService(process.env.RIOT_API_KEY!);

async function main() {
    console.log('🔧 Reparing Summoner IDs...');
    const players = await prisma.player.findMany();

    for (const p of players) {
        if (!p.summonerId) {
            console.log(`Processing ${p.gameName}...`);
            try {
                const s = await riotService.getSummonerByPuuid(p.puuid);
                console.dir(s); // DEBUG
                if (!s.id) throw new Error("No ID in response");
                await prisma.player.update({
                    where: { puuid: p.puuid },
                    data: { summonerId: s.id, profileIconId: s.profileIconId, summonerLevel: s.summonerLevel }
                });
                console.log(`✅ Fixed: ${s.id}`);
            } catch (e: any) {
                console.error(`❌ Failed: ${e.message}`);
            }
        } else {
            console.log(`✓ ${p.gameName} OK`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
