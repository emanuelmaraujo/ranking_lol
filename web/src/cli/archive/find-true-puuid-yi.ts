
import 'dotenv/config';
import { RiotService } from '../services/riot.service';

const riotService = new RiotService(process.env.RIOT_API_KEY!);

async function main() {
    console.log('Fetching true PUUID for Yi Espada Cega #BR1');
    try {
        const account = await riotService.getAccountByRiotId('Yi Espada Cega', 'BR1');
        console.log('True Account:', account);

        console.log('DB PUUID was: GOU_zQKbFXPFSjbn_TqaSaTm7Znc4D_4PYaOmMSnqHoQnJZbCN8bQ');

        if (account.puuid !== 'GOU_zQKbFXPFSjbn_TqaSaTm7Znc4D_4PYaOmMSnqHoQnJZbCN8bQ') {
            console.log('🚨 MISMATCH DETECTED!');
        } else {
            console.log('✅ PUUID Matches DB.');
        }
    } catch (e: any) {
        console.error(e.message);
    }
}
main();
