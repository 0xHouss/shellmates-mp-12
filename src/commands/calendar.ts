import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Event } from "../models/Event";

export const data = new SlashCommandBuilder()
    .setName("calendar")
    .setDescription("View all upcoming events");

export async function execute(interaction: ChatInputCommandInteraction) {
    const events = await Event.find().sort({ date: 1 });

    if (events.length === 0) {
        await interaction.reply("No upcoming events.");
        return;
    }

    const eventList = events.map(event => 
        `**${event.title}**\n📅 ${event.date ? event.date.toUTCString() : "Unknown Date"}\n🆔 ${event._id}\n${event.description || "No description"}`
    ).join("\n\n");
    
    await interaction.reply(eventList);
}
