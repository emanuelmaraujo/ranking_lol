
import 'dotenv/config';
import { RiotService } from '../services/riot.service';
import { PrismaClient } from '@prisma/client';
import { SEASON_CONFIG } from '../config/season';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const riotService = new RiotService(process.env.RIOT_API_KEY!);

const puuidArg = process.argv[2]; // Pass PUUID or Name search

// Helper for dual logging
const logs: string[] = [];
function log(msg: string) {
    console.log(msg);
    logs.push(msg);
}

async function main() {
    if (!puuidArg) {
        log("Usage: npx ts-node src/scripts/audit-matches.ts <gameName>");
        return;
    }

    const player = await prisma.player.findFirst({
        where: { gameName: { contains: puuidArg, mode: 'insensitive' } }
    });

    if (!player) {
        console.error("Player not found in DB.");
        return;
    }

    log(`\n🔍 Auditing Matches for: ${player.gameName} (#${player.tagLine})`);
    log(`📅 Season Start: ${SEASON_CONFIG.START_DATE}`);

    // Fetch Recent IDs
    log("... Fetching IDs from Riot...");
    const soloIds = await riotService.getRecentMatchIds(player.puuid, 420, 20);
    const flexIds = await riotService.getRecentMatchIds(player.puuid, 440, 20);
    const allIds = Array.from(new Set([...soloIds, ...flexIds]));

    log(`Found ${allIds.length} recent match IDs.`);

    log("\n| Match ID       | Queue | Date       | Duration | Status           | Reason                  |");
    log("|----------------|-------|------------|----------|------------------|-------------------------|");

    for (const matchId of allIds) {
        let status = "Unknown";
        let reason = "-";
        let queue = "???";
        let dateStr = "???";
        let duration = "???";

        try {
            // Check DB
            const dbMatch = await prisma.matchScore.findUnique({
                where: { playerId_matchId: { playerId: player.puuid, matchId } }
            });

            if (dbMatch) {
                status = "✅ SAVED";
            } else {
                status = "❌ MISSING";
            }

            // Fetch Details to Validate
            // Sleep to avoid 429 in audit
            await new Promise(r => setTimeout(r, 200));

            const match = await riotService.getMatchDetails(matchId);
            const creation = new Date(match.info.gameCreation);
            dateStr = creation.toISOString().split('T')[0];
            duration = (match.info.gameDuration / 60).toFixed(1) + "m";

            if (match.info.queueId === 420) queue = "SOLO";
            else if (match.info.queueId === 440) queue = "FLEX";
            else queue = `Other(${match.info.queueId})`;

            // Logic Check
            const seasonStart = new Date(`${SEASON_CONFIG.START_DATE}T00:00:00Z`).getTime();
            if (match.info.gameCreation < seasonStart) {
                reason = "Outside Season";
            } else if (match.info.gameDuration < 600) {
                reason = "Short Duration";
            } else {
                reason = "Valid";
            }

            if (dbMatch && reason === "Valid") status = "✅ OK";
            if (!dbMatch && reason !== "Valid") status = "⚠️ SKIP";
            if (!dbMatch && reason === "Valid") status = "🚨 ERROR"; // Should be saved!

        } catch (e: any) {
            status = "🔥 FAIL";
            reason = e.message;
        }

        log(`| ${matchId.padEnd(14)} | ${queue.padEnd(5)} | ${dateStr.padEnd(10)} | ${duration.padEnd(8)} | ${status.padEnd(16)} | ${reason.padEnd(23)} |`);
    }

    // Save to file
    const safeName = player.gameName.replace(/[^a-z0-9]/gi, '_');
    const timestamp = new Date().getTime();
    const filename = `audit_${safeName}_${timestamp}.txt`;
    const filepath = path.join(process.cwd(), filename);

    fs.writeFileSync(filepath, logs.join('\n'));
    console.log(`\n💾 Log saved to: ${filename}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
