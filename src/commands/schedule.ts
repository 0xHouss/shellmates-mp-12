import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { reminderHandler } from '..';
import { createEvent } from '../lib/google-calendar';
import EventModal from '../schemas/event';

function parseTime(input: string) {
    const now = new Date();

    // Handle absolute time in "dd-mm-yyyy HH:MM" or "dd/mm/yyyy HH:MM" format
    const absoluteTimeRegex = /^(\d{2})[-\/](\d{2})[-\/](\d{4})\s+(\d{2}):(\d{2})$/;
    const absoluteMatch = input.match(absoluteTimeRegex);

    if (absoluteMatch) {
        const day = parseInt(absoluteMatch[1], 10);
        const month = parseInt(absoluteMatch[2], 10) - 1; // Months are 0-indexed in JS Date
        const year = parseInt(absoluteMatch[3], 10);
        const hours = parseInt(absoluteMatch[4], 10);
        const minutes = parseInt(absoluteMatch[5], 10);

        const date = new Date(year, month, day, hours, minutes);

        // Validate and ensure the date is in the future
        if (!isNaN(date.getTime()) && date > now)
            return date;
    }

    // Handle relative times in "in X [unit]" format or other variations (e.g., "5 mins", "5s")
    const relativeTimeRegex = /(\d+)\s*(second|minute|hour|day|week|month|year|sec|min|s|m|h|d|w|mo|y)s?/i;

    if (relativeTimeRegex.test(input)) {
        const match = input.match(relativeTimeRegex);

        if (match) {
            const value = parseInt(match[1], 10);
            const unit = match[2].toLowerCase();

            const multiplierMap: Record<string, number> = {
                second: 1000,
                minute: 1000 * 60,
                hour: 1000 * 60 * 60,
                day: 1000 * 60 * 60 * 24,
                week: 1000 * 60 * 60 * 24 * 7,
                month: 1000 * 60 * 60 * 24 * 30, // Approximate
                year: 1000 * 60 * 60 * 24 * 365, // Approximate
                sec: 1000, // Alias for seconds
                min: 1000 * 60, // Alias for minutes
                s: 1000, // Alias for seconds
                m: 1000 * 60, // Alias for minutes
                h: 1000 * 60 * 60, // Alias for hours
                d: 1000 * 60 * 60 * 24, // Alias for days
                w: 1000 * 60 * 60 * 24 * 7, // Alias for weeks
                mo: 1000 * 60 * 60 * 24 * 30, // Alias for months (approximate)
                y: 1000 * 60 * 60 * 24 * 365, // Alias for years (approximate)
            };

            const multiplier = multiplierMap[unit];
            return new Date(now.getTime() + value * multiplier);
        }
    }
}

function parseLeadTime(input: string) {
    const relativeTimeRegex = /(\d+)\s*(second|minute|hour|day|week|month|year|sec|min|s|m|h|d|w|mo|y)s?/i;

    if (relativeTimeRegex.test(input)) {
        const match = input.match(relativeTimeRegex);

        if (match) {
            const value = parseInt(match[1], 10);
            const unit = match[2].toLowerCase();

            const multiplierMap: Record<string, number> = {
                second: 1000,
                minute: 1000 * 60,
                hour: 1000 * 60 * 60,
                day: 1000 * 60 * 60 * 24,
                week: 1000 * 60 * 60 * 24 * 7,
                month: 1000 * 60 * 60 * 24 * 30, // Approximate
                year: 1000 * 60 * 60 * 24 * 365, // Approximate
                sec: 1000, // Alias for seconds
                min: 1000 * 60, // Alias for minutes
                s: 1000, // Alias for seconds
                m: 1000 * 60, // Alias for minutes
                h: 1000 * 60 * 60, // Alias for hours
                d: 1000 * 60 * 60 * 24, // Alias for days
                w: 1000 * 60 * 60 * 24 * 7, // Alias for weeks
                mo: 1000 * 60 * 60 * 24 * 30, // Alias for months (approximate)
                y: 1000 * 60 * 60 * 24 * 365, // Alias for years (approximate)
            };

            const multiplier = multiplierMap[unit];
            return value * multiplier;
        }
    }
}


export default {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Schedule a new event')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the event')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('datetime')
                .setDescription('The date and time of the event')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('description')
                .setDescription('The description of the event')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('meet')
                .setDescription('The google meet link')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('leadtime')
                .setDescription('The lead time for the event')
                .setRequired(false)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const title = interaction.options.getString('title')!;
            const datetime = parseTime(interaction.options.getString('datetime')!);

            if (!datetime)
                return interaction.reply(`Invalid datetime format. Please use 'dd-mm-yyyy HH:MM', 'dd/mm/yyyy HH:MM', 'in X [unit]' or 'in X [unit]s' format."`);

            await interaction.deferReply({ ephemeral: true });

            const description = interaction.options.getString('description');
            const meetLink = interaction.options.getString('meet');
            const leadTime = interaction.options.getString('leadtime');
            let leadTimeMs;

            if (leadTime) {
                leadTimeMs = parseLeadTime(leadTime);

                if (!leadTimeMs)
                    return interaction.editReply(`Invalid lead time format. Please use 'X [unit]', 'X [unit]s' format."`);
            }

            const eventModal = new EventModal({
                userId: interaction.user.id,
                title,
                datetime,
                description,
                leadTimeMs,
                meetLink
            })

            const newEvent = await eventModal.save();

            await createEvent({
                summary: title,
                description,
                start: {
                    dateTime: datetime.toISOString(),
                    timeZone: 'GMT'
                },
                end: {
                    dateTime: new Date(datetime.getTime() + 60 * 60 * 1000).toISOString(),
                    timeZone: 'GMT'
                },
                location: meetLink
            })

            await interaction.editReply(`
### Event scheduled successfully!
**Title:** ${title}
**Date & Time:** ${datetime.toLocaleString()}
**Description:** ${description || 'N/A'}
**Google Meet Link:** ${meetLink || 'N/A'}
**ID:** ${newEvent.id}
            `);

            reminderHandler.handle(newEvent);
        } catch (error) {
            console.error(error);
            return interaction.reply('There was an error scheduling your event. Please make sure your input is valid and try again.');
        }
    }
};
