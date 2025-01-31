import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Event } from "../models/Event";
import mongoose from "mongoose";

export const data = new SlashCommandBuilder()
    .setName("cancel")
    .setDescription("Cancel a specific event")
    .addStringOption(option =>
        option.setName("id")
            .setDescription("The ID of the event to cancel")
            .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const eventId = interaction.options.getString("id");

    // Validate if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId!)) {
        await interaction.reply({ content: "❌ Invalid event ID format. Please provide a valid ID.", ephemeral: true });
        return;
    }

    try {
        const deletedEvent = await Event.findByIdAndDelete(eventId);

        if (!deletedEvent) {
            await interaction.reply({ content: "⚠️ Event not found. Please check the ID and try again.", ephemeral: true });
            return;
        }

        await interaction.reply({ content: `✅ Event **${deletedEvent.title}** has been canceled.`, ephemeral: false });

    } catch (error) {
        console.error("Error deleting event:", error);
        await interaction.reply({ content: "❌ An error occurred while canceling the event. Please try again later.", ephemeral: true });
    }
}
