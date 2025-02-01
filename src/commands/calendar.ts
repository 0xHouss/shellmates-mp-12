import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import Reminder from '../schemas/event';

export default {
    data: new SlashCommandBuilder()
        .setName('calendar')
        .setDescription('View all upcoming events'),
    async execute(interaction: ChatInputCommandInteraction) {
        const events = await Reminder.find({ datetime: { $gte: new Date() } }).sort({ datetime: 1 });

        if (!events.length) {
            const embed = new EmbedBuilder()
                .setTitle('No upcoming events')
                .setDescription('There are no upcoming events scheduled.')
                .setColor('Orange');

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('Upcoming Events')
            .setColor('Green');

        events.forEach(event => embed.addFields(
            {
                name: `**${event.title}**`,
                value: `📅 ${event.datetime ? event.datetime.toUTCString() : 'Unknown Date'}\n🆔 ${event._id}\n${event.description || 'No description'}`,
                inline: false
            }));

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
