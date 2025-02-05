import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { isValidEmail, isValidTimezone } from '../../lib/utils';
import UserModal from '../../schemas/user';
import SlashCommand from '../../templates/SlashCommand';

async function setPreferences(interaction: ChatInputCommandInteraction) {
    const timezone = interaction.options.getString('timezone');
    const email = interaction.options.getString('email');

    if (!timezone && !email) {
        const embed = new EmbedBuilder()
            .setTitle('No preferences provided !')
            .setDescription('Please provide at least one preference to set.')
            .setColor('Red');

        return await interaction.reply({ embeds: [embed] });
    }

    if (email) {
        if (!isValidEmail(email)) {
            const embed = new EmbedBuilder()
                .setTitle('Invalid email !')
                .setDescription('Please provide a valid email.')
                .setColor('Red');

            return await interaction.reply({ embeds: [embed] });
        }

        await UserModal.findOneAndUpdate({ userId: interaction.user.id }, { email }, { upsert: true })
    }

    if (timezone) {
        if (!isValidTimezone(timezone)) {
            const embed = new EmbedBuilder()
                .setTitle('Invalid timezone !')
                .setDescription('Please provide a valid IANA timezone. You can find a list here: [List of tz database time zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)')
                .setColor('Red');

            return await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        await UserModal.findOneAndUpdate({ userId: interaction.user.id }, { timezone }, { upsert: true })
    }

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

export default new SlashCommand({
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
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        const subcommands = {
            set: setPreferences,
            list: listPreferences
        }

        subcommands[subcommand as keyof typeof subcommands](interaction);
    }
})