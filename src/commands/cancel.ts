import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ObjectId } from 'mongodb';
import EventModal from "../schemas/event";

export default {
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
            await interaction.reply({ content: "❌ Invalid event ID format. Please provide a valid ID.", ephemeral: true });
            return;
        }

        try {
            const deletedEvent = await EventModal.findByIdAndDelete(eventId);

            if (!deletedEvent) {
                await interaction.reply({ content: "⚠️ Event not found. Please check the ID and try again.", ephemeral: true });
                return;
            }

            await interaction.reply({ content: `✅ Event **"${deletedEvent.title}"** has been canceled.`, ephemeral: false });

        } catch (error) {
            console.error("Error deleting event:", error);
            await interaction.reply({ content: "❌ An error occurred while canceling the event. Please try again later.", ephemeral: true });
        }
    }
};