import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { ObjectId } from 'mongodb';
import { googleCalendar } from '../..';
import EventModal from "../../schemas/event";
import SlashCommand from '../../templates/SlashCommand';

export default new SlashCommand({
    data: new SlashCommandBuilder()
        .setName("cancel")
        .setDescription("Cancel a specific event")
        .addStringOption(option =>
            option.setName("id")
                .setDescription("The ID of the event to cancel")
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const eventId = interaction.options.getString("id")!;

        // Validate if the provided ID is a valid MongoDB ObjectId
        if (!ObjectId.isValid(eventId)) {
            const embed = new EmbedBuilder()
                .setTitle("Invalid id !")
                .setDescription("The provided ID is not a valid event id.")
                .setColor("Red");

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            const canceledEvent = await EventModal.findByIdAndUpdate(eventId, { status: "Canceled" });

            if (!canceledEvent) {
                const embed = new EmbedBuilder()
                    .setTitle("Event not found !")
                    .setDescription("No event was found with the provided ID.")
                    .setColor("Red");

                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Remove event from google calendar
            await googleCalendar.removeEvent(canceledEvent.calendarEventId);

            const embed = new EmbedBuilder()
                .setTitle("Event canceled !")
                .setDescription(`The event **${canceledEvent.title}** has been successfully canceled.`)
                .setColor("Green");

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error("Error deleting event:", error);
            await interaction.reply({ content: "❌ An error occurred while canceling the event. Please try again later.", ephemeral: true });
        }
    }
})