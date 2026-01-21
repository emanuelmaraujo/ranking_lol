
import 'dotenv/config';
import axios from 'axios';

async function testKey() {
    const key = process.env.RIOT_API_KEY;
    console.log(`🔑 Testando chave: ${key?.substring(0, 5)}...${key?.substring(key.length - 4)}`);
    console.log(`🌐 Endpoint: https://br1.api.riotgames.com/lol/platform/v3/champion-rotations`);

    try {
        const response = await axios.get('https://br1.api.riotgames.com/lol/platform/v3/champion-rotations', {
            headers: {
                'X-Riot-Token': key
            }
        });
        console.log('✅ SUCESSO! A API Key está funcionando.');
        console.log('Status:', response.status);
    } catch (error: any) {
        console.error('❌ FALHA! A API Key foi rejeitada.');
        if (error.response) {
            console.error(`Status Code: ${error.response.status}`);
            console.error('Mensagem:', JSON.stringify(error.response.data));

            if (error.response.status === 403) {
                console.error('👉 403 significa que a chave é inválida, expirada, ou você não tem permissão para esta região.');
            }
        } else {
            console.error('Erro de conexão:', error.message);
        }
    }
}

testKey();
