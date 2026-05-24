import 'dotenv/config';
import { RiotService } from '../services/riot.service';
import { calculateMatchScore, MatchDTO, Participant } from '../engine/scoring.engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extended interface to include fields needed for persistence but not scoring
interface IngestMatchDTO extends MatchDTO {
    info: {
        gameDuration: number;
        gameCreation: number;
        queueId: number;
        participants: Participant[];
    };
}

// Helper: Canonical Duration (from participants)
const getMatchDurationSeconds = (participants: Participant[]): number => {
    return Math.max(...participants.map(p => p.timePlayed ?? 0));
};

async function main() {
    const puuid = process.argv[2];
    const matchId = process.argv[3];

    if (!puuid || !matchId) {
        console.error('Usage: npx ts-node src/cli/ingest-match.ts <PUUID> <MATCH_ID>');
        process.exit(1);
    }

    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) {
        console.error('Error: RIOT_API_KEY is not configured in .env');
        process.exit(1);
    }

    const riotService = new RiotService(apiKey);

    try {
        console.log(`Fetching match ${matchId}...`);
        const match = await riotService.getMatchDetails(matchId) as unknown as IngestMatchDTO;

        console.log(`Calculating score for ${puuid}...`);
        const result = calculateMatchScore(puuid, match);

        // Fail-safe Rule #1: If score is null (invalid match), DO NOT SAVE
        if (!result) {
            console.log('Match ignored (invalid)');
            return;
        }

        const participant = match.info.participants.find(p => p.puuid === puuid);
        if (!participant) {
            console.error('Participant not found in match data (unexpected after calc)');
            return;
        }

        // Check if score already exists (Idempotency)
        const existingScore = await prisma.matchScore.findUnique({
            where: {
                playerId_matchId: {
                    playerId: puuid,
                    matchId: matchId
                }
            }
        });

        // Fail-safe Rule #2: If exists, log and return (no error)
        if (existingScore) {
            console.log('Match already processed');
            return;
        }

        // --- PERSISTENCE ---

        // 1. Upsert Player
        // Since we don't have user input for display name here, we fallback to Riot ID or a placeholder if new.
        // But the requirement says "Player precisa aceitar nickname manual".
        // For ingestion, we assume the player *might* exist. If not, we create with Riot ID as display name.
        // Fix: Riot API v5 uses 'riotIdTagline' (lowercase l) but interface might be 'riotIdTagLine'
        // We handle both and fallback to empty string.
        const pAny = participant as any;
        const gameName = pAny.riotIdGameName ?? participant.riotIdGameName ?? "Unknown";
        const tagLine = pAny.riotIdTagline ?? participant.riotIdTagLine ?? "Unknown";

        const displayName = `${gameName}#${tagLine}`;

        await prisma.player.upsert({
            where: { puuid: puuid },
            update: {
                gameName: gameName,
                tagLine: tagLine,
            },
            create: {
                puuid: puuid,
                gameName: gameName,
                tagLine: tagLine,
                displayName: displayName,
                isActive: true
            }
        });

        // 2. Upsert Match
        // "Match precisa armazenar queueType explicitamente"
        // Riot API uses queueId (int). We map or store as is? 
        // User requested: queueType String // SOLO | FLEX
        // Map common queueIds: 420 = SOLO, 440 = FLEX. Others = OTHER.
        let queueType = 'OTHER';
        if (match.info.queueId === 420) queueType = 'SOLO';
        else if (match.info.queueId === 440) queueType = 'FLEX';

        const correctDuration = getMatchDurationSeconds(match.info.participants);
        // PATCH: Update match object with correct duration so Engine sees it too
        match.info.gameDuration = correctDuration;

        await prisma.match.upsert({
            where: { matchId: matchId },
            update: {}, // Immutable match data
            create: {
                matchId: matchId,
                queueType: queueType,
                gameCreation: new Date(match.info.gameCreation),
                gameDuration: correctDuration
            }
        });

        // 3. Create MatchScore
        // "MatchScore precisa guardar lane e victory separadamente"
        // result.breakdown.isVictory is boolean.
        // Lane is dependent on parsing logic in engine, but engine returns it in context usually? 
        // Wait, calculateMatchScore returns result.metrics, result.breakdown. 
        // It does NOT expose 'lane' directly in the top level return type MatchScoreResult in previous file view 
        // except implicitly used inside.
        // Let's check `result` object again. 
        // Looking at scoring.engine.ts: it does NOT return 'lane' in MatchScoreResult interface!
        // We need to re-derive it or update engine. 
        // CONSTRAINT: "❌ Não alterar scoring.engine.ts"
        // So we must re-derive lane using the same logic as engine helper `getLane`.
        // We will duplicate `getLane` logic here briefly or just trust the participant.teamPosition.
        // The engine uses: p.teamPosition as Lane if valid.

        const validLanes = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
        let lane = participant.teamPosition;
        if (!validLanes.includes(lane)) {
            lane = (participant as any).individualPosition;
        }
        if (!validLanes.includes(lane)) lane = 'MIDDLE';

        // Identify Opponent Champion
        const opponentPart = match.info.participants.find(p =>
            p.teamPosition === participant.teamPosition && p.teamId !== participant.teamId
        );

        await prisma.matchScore.create({
            data: {
                playerId: puuid,
                matchId: matchId,
                // New Fields Population
                queueType: queueType,
                lane: lane,
                championId: participant.championId,
                championName: participant.championName,
                opponentChampionId: opponentPart?.championId || null,
                opponentChampionName: opponentPart?.championName || 'Unknown',

                // Stats
                kills: participant.kills,
                deaths: participant.deaths,
                assists: participant.assists,

                isVictory: result.breakdown.isVictory,
                matchScore: result.matchScore,
                performanceScore: result.breakdown.performance,
                objectivesScore: result.breakdown.objectives,
                disciplineScore: result.breakdown.discipline,
                metrics: {
                    ...result.metrics,
                    kills: participant.kills,
                    deaths: participant.deaths,
                    assists: participant.assists,
                    championName: participant.championName,
                    championId: participant.championId
                } as any,
                ratios: result.ratios
            }
        });

        console.log('Match saved');

    } catch (error: any) {
        console.error('Error:', error.message);
        // Do not crash for "Match already processed" as checked above, but valid error logging for others.
    } finally {
        await prisma.$disconnect();
    }
}

main();
