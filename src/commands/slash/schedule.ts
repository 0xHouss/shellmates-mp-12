import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { parseDateTime, parseLeadTime, saveEvent } from '../../lib/utils';
import UserModal from '../../schemas/user';
import SlashCommand from '../../templates/SlashCommand';

export default new SlashCommand({
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Schedule a new event')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the event')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('datetime')
                .setDescription('The date and time of the event')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('description')
                .setDescription('The description of the event')
                .setRequired(false)
        )
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to announce the event')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('meet')
                .setDescription('The google meet link')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('leadtime')
                .setDescription('The lead time for the event')
                .setRequired(false)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            if (!interaction.guildId) return;

            const title = interaction.options.getString('title')!;
            const datetimeStr = interaction.options.getString('datetime')!;

            const user = await UserModal.findOne({ userId: interaction.user.id });
            const timezone = user?.timezone || undefined

            const datetime = parseDateTime(datetimeStr, timezone);

            if (!datetime) {
                const embed = new EmbedBuilder()
                    .setTitle("Invalid date & time format !")
                    .setDescription("Please use 'dd-mm-yyyy HH:MM', 'dd/mm/yyyy HH:MM', 'in X [unit]' or 'in X [unit]s' format.")
                    .setColor("Red");

                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            const description = interaction.options.getString('description') || undefined;
            const channel = interaction.options.getChannel('channel');
            const meetLink = interaction.options.getString('meet') || undefined;
            const leadTime = interaction.options.getString('leadtime');
            let leadTimeMs: number | undefined;

            if (leadTime) {
                leadTimeMs = parseLeadTime(leadTime);

                if (!leadTimeMs) {
                    const embed = new EmbedBuilder()
                        .setTitle("Invalid Lead Time Format !")
                        .setDescription("Please use 'X [unit]', 'X [unit]s' format.")
                        .setColor("Red");

                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
            }

            try {
                await interaction.deferReply({ ephemeral: true });

                const embed = await saveEvent({
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                    title,
                    datetime,
                    timezone,
                    leadTimeMs: leadTimeMs ?? 10 * 60 * 1000,
                    description,
                    channelId: channel?.id,
                    meetLink,
                });

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error("Error saving event:", error);

                const embed = new EmbedBuilder()
                    .setTitle("Error Scheduling Event")
                    .setDescription("There was an error scheduling your event. Please contact staff. ```" + error + "```")
                    .setColor("Red");

                await interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error("Error scheduling event:", error);

            const embed = new EmbedBuilder()
                .setTitle("Error Scheduling Event")
                .setDescription("There was an error scheduling your event. Please contact staff. ```" + error + "```")
                .setColor("Red");

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
})

