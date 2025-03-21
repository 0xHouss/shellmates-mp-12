import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { formatDateTime } from '../../lib/utils';
import EventModal from '../../schemas/event';
import UserModal from '../../schemas/user';
import SlashCommand from '../../templates/SlashCommand';

export default new SlashCommand({
    data: new SlashCommandBuilder()
        .setName('calendar')
        .setDescription('View all upcoming events'),
    async execute(interaction: ChatInputCommandInteraction) {
        // Get all upcoming events for this guild sorted by datetime in ascending order 
        const events = await EventModal.find({
            datetime: {
                $gte: new Date(),
            },
            guildId: interaction.guildId,
            status: "Pending"
        }).sort({ datetime: 1 });

        if (!events.length) {
            const embed = new EmbedBuilder()
                .setTitle('No upcoming events !')
                .setDescription('There are no upcoming events scheduled.')
                .setColor('Orange');

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const user = await UserModal.findOne({ userId: interaction.user.id });
        const timezone = user?.timezone || undefined;

        const embed = new EmbedBuilder()
            .setTitle('Upcoming Events')
            .setColor('Green');

        events.forEach(event => embed.addFields(
            {
                name: `**📌 ${event.title}**`,
                value: `${event.description || 'No description'}\n\n📅 ${formatDateTime(event.datetime, timezone)}\n🆔 \`${event._id}\``,
                inline: false
            }));

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
})
