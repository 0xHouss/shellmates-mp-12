import { Client, GatewayIntentBits } from 'discord.js';
import Bot from './lib/bot';
import { closeDatabaseConnection } from './lib/db';
import { GoogleCalendar } from './lib/google-calendar';
import { ReminderHandler } from './lib/reminder-handler';

export const bot = new Bot(
    new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ]
    })
)

export const reminderHandler = new ReminderHandler();
export const googleCalendar = new GoogleCalendar();

// Close the database connection when the process is terminated
process.on('SIGINT', async () => {
    await closeDatabaseConnection();
    process.exit(0);
});