import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { ObjectId } from 'mongodb';
import { googleCalendar, reminderHandler } from '..';
import EventModal from '../schemas/event';

function parseTime(input: string) {
    const now = new Date();

    // Handle absolute time in "dd-mm-yyyy HH:MM" or "dd/mm/yyyy HH:MM" format
    const absoluteTimeRegex = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/;
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

            if (!datetime) {
                const embed = new EmbedBuilder()
                    .setTitle("Invalid date & time format !")
                    .setDescription("Please use 'dd-mm-yyyy HH:MM', 'dd/mm/yyyy HH:MM', 'in X [unit]' or 'in X [unit]s' format.")
                    .setColor("Red");

                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            const description = interaction.options.getString('description');
            const meetLink = interaction.options.getString('meet');
            const leadTime = interaction.options.getString('leadtime');
            let leadTimeMs: number | null | undefined = null;

            if (leadTime) {
                leadTimeMs = parseLeadTime(leadTime);

                if (!leadTimeMs) {
                    const embed = new EmbedBuilder()
                        .setTitle("Invalid Lead Time Format !")
                        .setDescription("Please use 'X [unit]', 'X [unit]s' format.")
                        .setColor("Red");

                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
            }

            return await saveEvent({
                userId: interaction.user.id,
                title,
                datetime,
                description,
                meetLink,
                leadTimeMs: leadTimeMs || 10 * 60 * 1000,
            }, interaction);
        } catch (error) {
            console.error("Error scheduling event:", error);

            const embed = new EmbedBuilder()
                .setTitle("Error Scheduling Event")
                .setDescription("There was an error scheduling your event. Please contact staff. ```" + error + "```")
                .setColor("Red");

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};

async function saveEvent(
    event: {
        userId: string;
        title: string;
        datetime: Date;
        description: string | null;
        meetLink: string | null;
        leadTimeMs: number | null;
    },
    interaction: ChatInputCommandInteraction
) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const calendarEvent = await googleCalendar.createEvent({
            summary: event.title,
            description: event.description,
            start: {
                dateTime: event.datetime.toISOString(),
                timeZone: 'GMT'
            },
            end: {
                dateTime: new Date(event.datetime.getTime() + 60 * 60 * 1000).toISOString(),
                timeZone: 'GMT'
            },
            location: event.meetLink
        })

        const newEvent = new EventModal({ ...event, calendarEventId: calendarEvent.id });

        const res = await newEvent.save();

        const embed = new EmbedBuilder()
            .setTitle("✅ Meeting Scheduled Successfully!")
            .addFields(
                { name: "📌 Title", value: event.title },
                {
                    name: "🗓 Date & Time",
                    value: event.datetime.toString(),
                },
                { name: "🆔 ID", value: (res._id as ObjectId).toString() }
            )
            .setColor("Green");

        if (event.description)
            embed.addFields({ name: "📝 Description", value: event.description });

        if (event.meetLink)
            embed.addFields({ name: "🔗 Google Meet Link", value: event.meetLink });

        await interaction.editReply({ embeds: [embed] });

        reminderHandler.handle(res);
    } catch (error) {
        console.error("Error saving event:", error);

        const embed = new EmbedBuilder()
            .setTitle("Error Scheduling Event")
            .setDescription("There was an error scheduling your event. Please contact staff. ```" + error + "```")
            .setColor("Red");

        await interaction.editReply({ embeds: [embed] });
    }
}