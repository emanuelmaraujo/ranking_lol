
import 'dotenv/config';
import axios from 'axios';

async function main() {
    const puuid = "GOU_zQKbFXPFSjbn_TqaSaTm7Znc4D_4PYaOmMSnqHoQnJZbCN8bQ9FZCl0gGpULqjoHskAxqA";
    const apiKey = process.env.RIOT_API_KEY;

    // Check Summoner V4 (Platform) - BR1
    const summUrl = `https://br1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    console.log(`Checking Summoner: ${summUrl}`);
    try {
        const sRes = await axios.get(summUrl, { headers: { 'X-Riot-Token': apiKey } });
        console.log('Summoner Found:', sRes.data.name, 'Lvl:', sRes.data.summonerLevel);
    } catch (e: any) {
        console.error('Summoner Check Failed:', e.response?.status);
        console.error(JSON.stringify(e.response?.data, null, 2));
    }

    // Check Match V5 (Cluster) - Americas - No Params
    const matchUrl = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`;
    console.log(`\nChecking Matches: ${matchUrl}`);
    try {
        const res = await axios.get(matchUrl, {
            headers: { 'X-Riot-Token': apiKey }
        });
        console.log(`Matches Found: ${res.data.length}`);
        console.log('IDs (First 5):', res.data.slice(0, 5));
    } catch (e: any) {
        console.error('Match Check Failed:', e.response?.status);
        console.error(JSON.stringify(e.response?.data, null, 2));
    }
}

main();
