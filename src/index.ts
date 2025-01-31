import { Client, GatewayIntentBits } from 'discord.js';
import Bot from './lib/bot';
import { closeDatabaseConnection } from './lib/db';


export const bot = new Bot(
    new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ]
    })
)



process.on('SIGINT', async () => {
    await closeDatabaseConnection();
    process.exit(0);
});