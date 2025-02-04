import { ActionRowBuilder, CacheType, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction } from 'discord.js';
import config from '../../lib/config';
import SlashCommand from '../../templates/SlashCommand';

const commands = [
    { name: 'Schedule', id: 'schedule', emoji: '📅', description: 'Schedule a new event', syntax: `${config.BOT_PREFIX}schedule title! datetime! description? leadtime? meet? channel? mentions?`, details: 'Sets up a **new event** with required and optional parameters.' },
    { name: 'Preferences', id: 'preferences', emoji: '⚙️', description: 'Configure your preferences', syntax: '/preferences timezone? email?', details: 'Adjust **personal settings** such as **timezone** and **email** for notifications.' },
    { name: 'Calendar', id: 'calendar', emoji: '🗓️', description: 'Display upcoming meetings', syntax: '/calendar', details: 'Shows upcoming **events**.' },
    { name: 'Cancel', id: 'cancel', emoji: '❌', description: 'Cancel an upcoming meeting', syntax: '/cancel id!', details: 'Cancels an **event** using its **unique ID**.' },
    { name: 'Help', id: 'help', emoji: '❓', description: 'Display the help menu', syntax: '/help', details: 'Shows **information** about all available **commands**.' }
];

export default new SlashCommand({
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display a help menu with every command available'),
    async execute(interaction) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('command_select')
            .setPlaceholder('Select a command...')
            .addOptions(commands.map(cmd => ({
                label: `${cmd.emoji} ${cmd.name}`,
                value: cmd.id,
                description: cmd.description
            })));

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

        const helpEmbed = new EmbedBuilder()
            .setTitle('**✨ Help Menu**')
            .setDescription('Choose a command from the dropdown below to get more details about it.')
            .addFields(commands.map(cmd => ({ name: `${cmd.emoji} **${cmd.name}**`, value: cmd.description })))
            .setColor("Blue")

        await interaction.reply({ embeds: [helpEmbed], components: [row] });

        if (!interaction.channel || !('createMessageComponentCollector' in interaction.channel)) return;

        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.customId === 'command_select' && i.user.id === interaction.user.id,
            time: 15_000_000
        });

        collector.on('collect', async (i: StringSelectMenuInteraction<CacheType>) => {
            const selectedCommand = commands.find(cmd => cmd.id === i.values[0]);
            if (!selectedCommand) return;

            const embed = new EmbedBuilder()
                .setTitle(`${selectedCommand.emoji} **${selectedCommand.name} Command**`)
                .setDescription(selectedCommand.details)
                .addFields(
                    { name: '**Syntax**', value: "```" + selectedCommand.syntax + "```" },
                )
                .setColor("Blue")

            await i.update({
                embeds: [embed],
                components: [i.message.components[0]]
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time')
                interaction.editReply({ content: 'Sorry, the interaction timed out ! Looks like there is no ACK to your SYN...', components: [] });
        });
    }
})