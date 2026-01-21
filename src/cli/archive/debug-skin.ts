
import { RiotService } from '../services/riot.service';
import dotenv from 'dotenv';
dotenv.config();

const riotService = new RiotService(process.env.RIOT_API_KEY || '');

async function run() {
    console.log('--- Debugging Vayne Skin ---');
    const name = 'Vayne';
    console.log(`Fetching skin for: ${name}`);
    const skin = await riotService.getRandomSkin(name);
    console.log('Result:', skin);

    console.log('\n--- Debugging Kai\'Sa (Control) ---');
    const kaisa = await riotService.getRandomSkin('Kai\'Sa');
    console.log('Result:', kaisa);
}

run();
