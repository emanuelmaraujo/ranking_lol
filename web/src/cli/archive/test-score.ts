import 'dotenv/config';
import { RiotService } from '../services/riot.service';
import { calculateMatchScore } from '../engine/scoring.engine';

async function main() {
    const puuid = process.argv[2];
    const matchId = process.argv[3];

    if (!puuid || !matchId) {
        console.error('Usage: ts-node src/cli/test-score.ts <puuid> <matchId>');
        process.exit(1);
    }

    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey || apiKey === 'RGAPI-KEY') {
        console.error('Error: RIOT_API_KEY is not configured in .env');
        process.exit(1);
    }

    const riotService = new RiotService(apiKey);

    try {
        console.log(`Fetching match ${matchId}...`);
        const match = await riotService.getMatchDetails(matchId);

        // --- RULES OF EXCLUSION ---

        // 1. Duration Rule (>= 10 min)
        const duration = match.info.gameDuration;
        if (duration < 600) {
            console.log('Match ignored: duration < 10 minutes');
            return;
        }

        // 2. Season 2026 Rule
        const gameCreation = match.info.gameCreation; // Epoch ms
        const gameDate = new Date(gameCreation);

        // Configurable 2026 dates (Months are 0-indexed in JS, but string constructor is easier)
        const seasonStart = new Date('2026-01-01T00:00:00Z').getTime();
        const seasonEnd = new Date('2026-12-31T23:59:59Z').getTime();

        if (gameCreation < seasonStart || gameCreation > seasonEnd) {
            console.log('Match outside Season 2026 – ignored');
            // For testing purposes, we continue validation if user wants, but per spec we must "Warn".
            // Specification says "O CLI deve avisar... O score não deve ser calculado".
            // So we return.
            return;
        }

        // --- CALCULATION ---
        console.log(`Calculating score for ${puuid}...`);
        const result = calculateMatchScore(puuid, match);

        console.log(JSON.stringify({
            matchId,
            puuid,
            matchScore: result.matchScore,
            breakdown: result.breakdown,
            metrics: {
                kda: result.laneContext.laneAvgKda, // Warning: These are averages, to get the player's metrics we need to access the helper internal or just trust the breakdown logic verified them. 
                // Ideally the CLI might want to see raw metrics too, but the Engine return type 'laneContext' gives context.
                // Let's print what we have.
            },
            laneContext: result.laneContext
        }, null, 2));

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

main();
