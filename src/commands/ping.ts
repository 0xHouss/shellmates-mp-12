import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('ping the bot'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply('Pong !');
    }
};
