
import 'dotenv/config';
import { RiotService } from '../services/riot.service';

const riotService = new RiotService(process.env.RIOT_API_KEY!);

async function main() {
    // PUUID for YasoneShelby (from logs)
    const puuid = "5EXCAJV6W11UOnGlMoOYnKttqv7xBTNTzTDUxfJTgDLcSL5GDcJE2SqeurFbgF9O6Z-VKyyVKqfu2Q";

    console.log(`fetching summoner for ${puuid}...`);
    try {
        const s = await riotService.getSummonerByPuuid(puuid);
        console.log("--- JSON START ---");
        console.log(JSON.stringify(s, null, 2));
        console.log("--- JSON END ---");
        console.log(`Accessing s.id: ${s.id}`);
        console.log(`Accessing s['id']: ${s['id']}`);
    } catch (e) {
        console.error(e);
    }
}

main();
