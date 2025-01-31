import { Client, GatewayIntentBits } from 'discord.js';
import Bot from './lib/bot';
import { closeDatabaseConnection } from './lib/db';
import handleReminders, { startReminderService } from './lib/reminderHandler';

export const bot = new Bot(
    new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ]
    })
)

bot.client.once('ready', async () => {
  try {
    console.log('Bot is ready!');
    startReminderService(bot.client);
  } catch (error) {
    console.error('Error starting reminder service:', error);
  }
});

process.on('SIGINT', async () => {
    await closeDatabaseConnection();
    process.exit(0);
});