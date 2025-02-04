import { ActionRowBuilder, Collection, CommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder, StringSelectMenuBuilder } from 'discord.js';

const commands = [
    { name: 'Schedule', id: 'schedule', emoji: '📅', description: '**View the events and meetings schedules**', syntax: '`/schedule title! date! desc? tags? type?`', details: 'Sets up a **new event** with required and optional parameters.' },
    { name: 'Pref', id: 'pref', emoji: '⏳', description: '**Sets users preferences**', syntax: '`/pref timezone? leadtime?`', details: 'Adjust **personal settings** such as **timezone** and **lead time** for notifications.' },
    { name: 'Calendar', id: 'calendar', emoji: '🗓️', description: '**Displays upcoming meetings in a calendar format**', syntax: '`/calendar type?`', details: 'Shows **events** in a **daily or monthly view**.' },
    { name: 'Cancel', id: 'cancel', emoji: '❌', description: '**Cancels a scheduled meeting**', syntax: '`/cancel id!`', details: 'Cancels an **event** using its **unique ID**.' },
    { name: 'Help', id: 'help', emoji: '❓', description: '**Displays the help menu with details about commands and usage**', syntax: '`/help`', details: 'Shows **information** about all available **commands**.' }
];

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display a help menu with every command available'),

    async execute(interaction: CommandInteraction) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('command_select')
            .setPlaceholder('Select a command...')
            .addOptions(commands.map(cmd => ({
                label: `${cmd.emoji} ${cmd.name}`,
                value: cmd.id,
                description: cmd.description.replace('**', '').replace('**', '')
            })));

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
        const helpEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('✨ **Help Menu**')
            .setDescription('Choose a command from the dropdown below to get more details about it.')
            .addFields(commands.map(cmd => ({ name: `${cmd.emoji} **${cmd.name}**`, value: cmd.description })))
            .setFooter({ text: 'Use the dropdown menu to interact!' });

        await interaction.reply({ embeds: [helpEmbed], components: [row] });

        const filter = (i: any) => i.customId === 'command_select' && i.user.id === interaction.user.id;
        if (!interaction.channel || !('createMessageComponentCollector' in interaction.channel)) return;

        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000000 });

        collector.on('collect', async (i: any) => {
            const selectedCommand = commands.find(cmd => cmd.id === i.values[0]);
            if (!selectedCommand) return;

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`${selectedCommand.emoji} **${selectedCommand.name} Command**`)
                .setDescription(selectedCommand.details)
                .addFields(
                    { name: '**Syntax**', value: selectedCommand.syntax },
                    { name: '**Description**', value: selectedCommand.description }
                );

            await i.update({
                embeds: [embed],
                components: [i.message.components[0]],
                flags: MessageFlags.Ephemeral
            });
        });

        collector.on('end', (collected: Collection<string, any>, reason: string) => {
            if (reason === 'time') {
                interaction.editReply({ content: 'Sorry, the interaction timed out!', components: [] });
            }
        });

    }
};