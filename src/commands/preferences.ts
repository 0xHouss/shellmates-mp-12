import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { isValidEmail } from '../lib/utils';
import UserModal from '../schemas/user';

async function setPereferences(interaction: ChatInputCommandInteraction) {
    const timezone = interaction.options.getString('timezone');
    const email = interaction.options.getString('email');

    if (!timezone && !email) {
        const embed = new EmbedBuilder()
            .setTitle('No preferences provided !')
            .setDescription('Please provide at least one preference to set.')
            .setColor('Red');

        return await interaction.reply({ embeds: [embed] });
    }

    if (email && !isValidEmail(email)) {
        const embed = new EmbedBuilder()
            .setTitle('Invalid email !')
            .setDescription('Please provide a valid email.')
            .setColor('Red');

        return await interaction.reply({ embeds: [embed] });
    }

    if (email)
        await UserModal.findOneAndUpdate({ userId: interaction.user.id }, { email }, { upsert: true })

    if (timezone)
        await UserModal.findOneAndUpdate({ userId: interaction.user.id }, { timezone }, { upsert: true })

    const embed = new EmbedBuilder()
        .setTitle('Your preferences have been set !')
        .setColor('Green');

    await interaction.reply({ embeds: [embed] });
}

async function listPreferences(interaction: ChatInputCommandInteraction) {
    const user = await UserModal.findOne({ userId: interaction.user.id });

    if (!user)
        return await interaction.reply(`No preferences found.`);

    const embed = new EmbedBuilder()
        .setTitle('Preferences')
        .setDescription(
            `**Timezone:** ${user.timezone || 'Not set'}\n` +
            `**Email:** ${user.email || 'Not set'}`
        )
        .setColor('Blue');

    await interaction.reply({ embeds: [embed] });
}

export default {
    data: new SlashCommandBuilder()
        .setName('preferences')
        .setDescription('Preferences commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Configure your preferences')
                .addStringOption(option =>
                    option.setName('timezone')
                        .setDescription('The timezone to set')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('email')
                        .setDescription('The email to set')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List your preferences')
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();

        const subcommands = {
            set: setPereferences,
            list: listPreferences
        }

        subcommands[subcommand as keyof typeof subcommands](interaction);
    }
};
