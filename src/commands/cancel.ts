import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
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
        const eventId = interaction.options.getString("id");

        const deletedEvent = await EventModal.findByIdAndDelete(eventId);

        if (!deletedEvent) {
            await interaction.reply("Event not found.");
            return;
        }

        await interaction.reply(`Event **${deletedEvent.title}** has been canceled.`);
    }
};