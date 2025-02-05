import { EmbedBuilder, Role, User } from 'discord.js';
import { DateTime, Duration, Settings } from 'luxon';
import { ObjectId } from 'mongoose';
import { zones as timezones } from 'tzdata';
import { googleCalendar, reminderHandler } from '..';
import EventModal from '../schemas/event';
import UserModal from '../schemas/user';

Settings.defaultZone = "Africa/Algiers";

export type Timezone = keyof typeof timezones;

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const formatDateTime = (date: Date, timezone?: Timezone) => DateTime.fromJSDate(date, { zone: timezone }).toFormat('dd-MM-yyyy HH:mm ZZZZ');

export const getReminderTime = (eventDate: Date, leadTimeMs: number) => new Date(eventDate.getTime() - leadTimeMs);

export const removeDuplicates = <T>(arr: T[]) => [...new Set(arr)];

export const isValidTimezone = (timezone: string) => timezone in timezones;

export const unitMap: Record<string, string> = {
    second: 'seconds',
    minute: 'minutes',
    hour: 'hours',
    day: 'days',
    week: 'weeks',
    month: 'months',
    year: 'years',
    sec: 'seconds',
    min: 'minutes',
    s: 'seconds',
    m: 'minutes',
    h: 'hours',
    d: 'days',
    w: 'weeks',
    mo: 'months',
    y: 'years',
};

// Parse a datetime from a string input like "2022-12-31 23:59", "2022/12/31 23:59", "in 5 minutes", "5 mins", "5m", etc.
export function parseDateTime(input: string, timezone?: Timezone) {
    const now = DateTime.local({ zone: timezone });

    // Handle absolute time in "yyyy-mm-dd HH:MM" or "yyyy/mm/dd HH:MM" format
    const absoluteTimeRegex = /^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})\s+(\d{2}):(\d{2})$/;
    const absoluteMatch = input.match(absoluteTimeRegex);

    if (absoluteMatch) {
        const year = parseInt(absoluteMatch[1], 10);
        const month = parseInt(absoluteMatch[2], 10);
        const day = parseInt(absoluteMatch[3], 10);
        const hours = parseInt(absoluteMatch[4], 10);
        const minutes = parseInt(absoluteMatch[5], 10);

        const date = DateTime.fromObject({
            year,
            month,
            day,
            hour: hours,
            minute: minutes,
        }, { zone: timezone });

        if (date.isValid && date > now)
            return date.toJSDate();
    }

    // Handle relative times in "in X [unit](s)" format or other variations (e.g., "5 mins", "5s")
    const relativeTimeRegex = /(\d+)\s*(second|minute|hour|day|week|month|year|sec|min|s|m|h|d|w|mo|y)s?/i;
    const match = input.match(relativeTimeRegex);

    if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();

        if (unitMap[unit])
            return now
                .plus({ [unitMap[unit]]: value })
                .toJSDate();
    }
}

// Parse the lead time in milliseconds from a string input like "5 minutes", "1 hour", etc.
export function parseLeadTime(input: string) {
    const relativeTimeRegex = /(\d+)\s*(second|minute|hour|day|week|month|year|sec|min|s|m|h|d|w|mo|y)s?/i;

    if (relativeTimeRegex.test(input)) {
        const match = input.match(relativeTimeRegex);

        if (match) {
            const value = parseInt(match[1], 10);
            const unit = match[2].toLowerCase();

            const luxonUnit = unitMap[unit];
            if (!luxonUnit) return;

            return Duration.fromObject({ [luxonUnit]: value }).toMillis();
        }
    }
}

export async function getAttendeesEmails(roles?: Role[], users?: User[]) {
    const attendeesIds = new Set<string>();
    const attendeesEmails = []

    if (roles) {
        for (const role of roles) {
            for (const member of role.members.values()) {
                attendeesIds.add(member.user.id);
            }
        }
    }

    if (users) {
        for (const user of users) {
            attendeesIds.add(user.id);
        }
    }

    for (const attendeeId of attendeesIds) {
        const user = await UserModal.findOne({ userId: attendeeId });

        if (user?.email) attendeesEmails.push({ email: user.email });
    }

    return attendeesEmails;
}

export async function saveEvent(
    event: {
        userId: string;
        guildId: string;
        title: string;
        datetime: Date;
        timezone?: Timezone;
        description?: string;
        leadTimeMs?: number;
        meetLink?: string;
        roles?: Role[];
        users?: User[];
        channelId?: string;
    }
) {
    const attendees = await getAttendeesEmails(event.roles, event.users);

    const calendarEvent = await googleCalendar.createEvent({
        summary: event.title,
        description: event.description,
        start: {
            dateTime: event.datetime.toISOString(),
            timeZone: event.timezone
        },
        end: {
            dateTime: new Date(event.datetime.getTime() + 60 * 60 * 1000).toISOString(),
            timeZone: event.timezone
        },
        attendees,
        location: event.meetLink
    })

    const newEvent = new EventModal({
        userId: event.userId,
        guildId: event.guildId,
        title: event.title,
        channelId: event.channelId,
        datetime: event.datetime,
        description: event.description,
        meetLink: event.meetLink,
        leadTimeMs: event.leadTimeMs,
        roles: event.roles?.map(role => role.id),
        users: event.users?.map(user => user.id),
        calendarEventId: calendarEvent.id
    });

    const res = await newEvent.save();

    const embed = new EmbedBuilder()
        .setTitle("✅ Event Scheduled Successfully!")
        .addFields(
            { name: "📌 Title", value: event.title },
            {
                name: "🗓 Date & Time",
                value: formatDateTime(event.datetime, event.timezone)
            },
            { name: "🆔 ID", value: (res._id as ObjectId).toString() }
        )
        .setColor("Green");

    if (event.description)
        embed.addFields({ name: "📝 Description", value: event.description });

    if (event.channelId)
        embed.addFields({ name: "📡 Channel", value: `<#${event.channelId}>` });

    if (event.meetLink)
        embed.addFields({ name: "🔗 Google Meet Link", value: event.meetLink });

    if (event.channelId) {
        embed.addFields({ name: "📡 Channel", value: `<#${event.channelId}>` });
    }

    if (event.roles?.length || event.users?.length) {
        const mentions: string[] = [];

        if (event.roles?.length) {
            mentions.push(...event.roles.map(role => `<@&${role.id}>`));
        }

        if (event.users?.length) {
            mentions.push(...event.users.map(user => `<@${user.id}>`));
        }

        embed.addFields({ name: "👥 Participants", value: mentions.join(", ") });
    }

    reminderHandler.handle(res);

    return embed

}