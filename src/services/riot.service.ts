import axios, { AxiosInstance } from 'axios';
import Bottleneck from 'bottleneck';

export class RiotService {
    private readonly regionUrl = 'https://americas.api.riotgames.com'; // Default to Americas for BR/NA
    private readonly platformUrl = 'https://br1.api.riotgames.com'; // Default to BR1 for Summoner V4
    private readonly apiKey: string;
    private readonly limiter: Bottleneck;
    private readonly axiosInstance: AxiosInstance;

    constructor(apiKey: string) {
        this.apiKey = apiKey;

        // Rate Limiter Strategy (Burst Friendly)
        // Riot Dev Key Limits: 
        // 1. 20 requests every 1 second
        // 2. 100 requests every 2 minutes
        //
        // Configuration:
        // - Burst: Allow fast execution (minTime 50ms = 20 req/s)
        // - Long Term: Cap at ~90 requests every 2 minutes via Reservoir to be safe.
        this.limiter = new Bottleneck({
            minTime: 50,               // Cap at 20 req/s (Short term limit)
            maxConcurrent: 5,          // Allow some concurrency
            reservoir: 90,             // Start with 90 tokens (Safe buffer under 100)
            reservoirRefreshAmount: 90,
            reservoirRefreshInterval: 120 * 1000 // Refill every 2 minutes
        });

        // Retry Strategy for 429
        this.limiter.on('failed', async (error: any, jobInfo) => {
            const status = error.response?.status;
            if (status === 429) {
                const retryAfter = parseInt(error.response?.headers['retry-after'] || '10', 10);
                console.warn(`⏳ Rate Limit Hit. Waiting ${retryAfter}s...`);
                return retryAfter * 1000 + 1000; // Wait + Buffer
            }
            if (status >= 500) return 5000; // Retry server errors
            return null; // Don't retry others (404, 403, etc)
        });

        this.axiosInstance = axios.create({
            headers: {
                'X-Riot-Token': this.apiKey,
            },
        });
    }

    private async executeRequest<T>(url: string): Promise<T> {
        return this.limiter.schedule(async () => {
            try {
                // Pre-flight check could go here if we tracked global state, 
                // but diff-check is mostly business logic (DB vs API).

                const response = await this.axiosInstance.get<T>(url);
                return response.data;
            } catch (error: any) {
                if (error.response?.status === 429) {
                    // Re-throw to be caught by limiter 'failed' listener or caller
                    throw error;
                }
                if (error.response?.status === 404) {
                    // 404 is valid result (not found), don't abort, just throw
                    throw error;
                }

                console.error(`API Error [${url}]: ${error.response?.status} - ${JSON.stringify(error.response?.data, null, 2)}`);
                throw error;
            }
        });
    }

    /**
     * Resolves GameName + TagLine to Account DTO (Account-V1)
     */
    async getAccountByRiotId(gameName: string, tagLine: string): Promise<{ puuid: string; gameName: string; tagLine: string }> {
        const url = `${this.regionUrl}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
        return this.executeRequest<{ puuid: string; gameName: string; tagLine: string }>(url);
    }

    /**
     * Resolves GameName + TagLine to PUUID (Legacy Helper)
     */
    async getPuuid(gameName: string, tagLine: string): Promise<string> {
        const account = await this.getAccountByRiotId(gameName, tagLine);
        return account.puuid;
    }

    /**
   * Fetches Ranked Match IDs (Match-V5)
   * Supports specific queueIds: 420 (Solo) and 440 (Flex)
   * Region Routing: Uses 'americas' for Match-V5 (cluster) and specific platform (e.g. 'br1') for Account-V1
   */
    async getRecentMatchIds(puuid: string, queueId?: number, count: number = 20): Promise<string[]> {
        const MAX_PER_REQ = 100;
        let allIds: string[] = [];
        let fetched = 0;

        while (fetched < count) {
            const currentBatchSize = Math.min(count - fetched, MAX_PER_REQ);
            let url = `${this.regionUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${fetched}&count=${currentBatchSize}`;
            if (queueId) {
                url += `&queue=${queueId}`;
            }

            const ids = await this.executeRequest<string[]>(url);
            if (ids.length === 0) break;

            allIds = allIds.concat(ids);
            fetched += ids.length;

            // If we got less than requested, we reached the end
            if (ids.length < currentBatchSize) break;
        }

        return allIds;
    }

    /**
     * Fetches Match Details (Match-V5)
     */
    async getMatchDetails(matchId: string): Promise<any> {
        const url = `${this.regionUrl}/lol/match/v5/matches/${matchId}`;
        return this.executeRequest<any>(url);
    }

    /**
     * Get Summoner by PUUID (Summoner-V4)
     * Needed to get 'id' (SummonerID) for League-V4
     */
    async getSummonerByPuuid(puuid: string): Promise<any> {
        const url = `${this.platformUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
        console.log(`[RiotService] Fetching Summoner: ${url}`);
        return this.executeRequest<any>(url);
    }

    /**
     * Get League Entries (League-V4)
     * Returns all ranked entries (Solo/Flex)
     */
    async getLeagueEntries(summonerId: string): Promise<any[]> {
        const url = `${this.platformUrl}/lol/league/v4/entries/by-summoner/${summonerId}`;
        return this.executeRequest<any[]>(url);
    }

    async getLeagueEntriesByPuuid(puuid: string): Promise<any[]> {
        const url = `${this.platformUrl}/lol/league/v4/entries/by-puuid/${puuid}`;
        return this.executeRequest<any[]>(url);
    }

    /**
     * Get Champion Mastery (Mastery-V4)
     * Returns top champions for a player
     */
    async getChampionMasteries(puuid: string, count: number = 10): Promise<any[]> {
        // Correct endpoint for Mastery V4
        const url = `${this.platformUrl}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`;
        return this.executeRequest<any[]>(url);
    }

    /**
     * Get Random Skin for Champion (Data Dragon)
     * Returns the splash URL of a RANDOM skin from the list (including default and legacy)
     */
    async getRandomSkin(championName: string): Promise<{ name: string; splashUrl: string; loadingUrl: string } | null> {
        try {
            // Normalize Name for Data Dragon
            // 1. Explicit Overrides for Void/Special Characters
            const overrides: Record<string, string> = {
                'Wukong': 'MonkeyKing',
                'Renata Glasc': 'Renata',
                'RenataGlasc': 'Renata',
                'Nunu & Willump': 'Nunu',
                'Nunu&Willump': 'Nunu',
                'Fiddlesticks': 'Fiddlesticks',
                // Void & Special Casing
                'Bel\'Veth': 'Belveth',
                'Cho\'Gath': 'Chogath',
                'Kai\'Sa': 'Kaisa',
                'Kha\'Zix': 'Khazix',
                'Kog\'Maw': 'KogMaw',
                'K\'Sante': 'KSante',
                'LeBlanc': 'Leblanc',
                'Rek\'Sai': 'RekSai',
                'Vel\'Koz': 'Velkoz',
                // Common Typos / Internal Names
                'KaiSa': 'Kaisa',
                'VelKoz': 'Velkoz',
                'ChoGath': 'Chogath',
                'KhaZix': 'Khazix',
                'BelVeth': 'Belveth'
            };

            let cName = overrides[championName] || championName;

            // 2. Remove special characters (types like "Dr. Mundo" -> "DrMundo", "Master Yi" -> "MasterYi")
            // This handles most standard names that just need spaces/dots removed while keeping case.
            if (!overrides[championName]) {
                cName = cName.replace(/[^a-zA-Z0-9]/g, '');
            }

            // Fetch Champion Data
            // We use a fixed recent version or fetch standard
            const version = '16.1.1'; // Updated to 2026 Season
            const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${cName}.json`;

            // Bypass rate limiter for DataDragon (It's a CDN)
            const res = await axios.get(url);
            const data = res.data.data[cName];

            if (!data || !data.skins || data.skins.length === 0) return null;

            // Filter out default skin (num === 0) to ensure we show a REAL skin
            const nonDefaultSkins = data.skins.filter((s: any) => s.num !== 0);
            const pool = nonDefaultSkins.length > 0 ? nonDefaultSkins : data.skins;

            // Pick a RANDOM skin
            const randomIndex = Math.floor(Math.random() * pool.length);
            const skin = pool[randomIndex];

            return {
                name: skin.name,
                splashUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${cName}_${skin.num}.jpg`,
                loadingUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${cName}_${skin.num}.jpg`
            };
        } catch (e) {
            console.error(`[RiotService] Failed to fetch skin for ${championName}`, e);
            return null;
        }
    }
}
