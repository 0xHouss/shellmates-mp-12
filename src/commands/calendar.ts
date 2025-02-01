import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Reminder from '../schemas/event';

export default {
    data: new SlashCommandBuilder()
        .setName('calendar')
        .setDescription('View all upcoming events'),
    async execute(interaction: ChatInputCommandInteraction) {
       
        const now = new Date();

        const events = await Reminder.find({ datetime: { $gte: now } }).sort({ datetime: 1 });

        if (!events.length) {
            return await interaction.reply('No upcoming events.');
        }

        const eventList = events.map(event =>
            `**${event.title}**\n📅 ${event.datetime ? event.datetime.toUTCString() : 'Unknown Date'}\n🆔 ${event._id}\n${event.description || 'No description'}`
        ).join('\n\n');

        await interaction.reply(eventList);
    },
};
