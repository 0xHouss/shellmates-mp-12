import { Message } from "discord.js";
import { ObjectId } from "mongodb";
import { reminderHandler } from "..";
import { parseDateTime } from "../lib/utils";
import Event from "../schemas/event";

export default async function scheduleCommand(message: Message) {
    if (message.author.bot) return;

    const args = message.content.split(" ").slice(1);
    if (args.length == 0) {
        return message.reply(` 
To schedule a meeting, use the following format:
\`!schedule "Title of the Meeting" YYYY-MM-DD HH:MM @Role [Optional: Description] [Optional: Google Meet Link]\`

Example:
\`!schedule "Team Sync" 2023-10-10 14:30 @Developers "Weekly team sync meeting" https://meet.google.com/abc-xyz\ `);
    }

    const remainingArgs = args.join(" ");
    const regex =
        /"([^"]+)"\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+(<@&\d+>|<@!?\d+>|@everyone|@here)(?:\s+"([^"]*)")?(?:\s+(https?:\/\/\S+))?/;
    const match = remainingArgs.match(regex);

    if (match) {
        const title = match[1];
        const date = match[2];
        const time = match[3];
        const role = match[4];
        const description = match[5] || null;
        const meetLink = match[6] || null;

        const timezone = "America/New_York";
        const dateTime = parseDateTime(date, time, timezone);

        if (isNaN(dateTime.getTime())) {
            return message.reply(
                "Invalid date or time format. Use YYYY-MM-DD HH:mm."
            );
        }

        let mentionedRoles: any = message.mentions.roles.map((role) =>
            role.toString()
        );
        if (mentionedRoles.length === 0) {
            mentionedRoles = role;
        }

        const scheduleData = {
            title,
            dateTime,
            roleIds: message.mentions.roles.map((role) => role.id),
            rolename: mentionedRoles,
            description,
            meetLink,
        };

        insertReminder(scheduleData, message);
        return;
    } else {
        return message.reply(
            'Usage: !schedule "Meeting Title" YYYY-MM-DD HH:mm @participants'
        );
    }
}

async function insertReminder(
    scheduleData: {
        title: string;
        dateTime: Date;
        roleIds: string[];
        rolename: string[] | string;
        description: string | null;
        meetLink: string | null;
    },
    message: Message
) {
    const { title, dateTime, rolename, description, meetLink } = scheduleData;

    try {
        const newEvent = new Event({
            userId: message.author.id,
            title,
            datetime: dateTime,
            description,
            leadTimeMs: 10 * 60 * 1000,
            channelId: message.channel.id,
            meetLink,
        });

        const res = await newEvent.save();
        reminderHandler.handle(res);

        let confirmationMessage = `
    🎉 **Meeting Scheduled Successfully!**
    **Title:** ${title}
    **Date & Time:** ${dateTime.toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        })}
    **Role:** ${Array.isArray(rolename) ? rolename.join(", ") : rolename}
    `;

        if (description) {
            confirmationMessage += `**Description:** ${description}\n`;
        }

        if (meetLink) {
            confirmationMessage += `**Google Meet Link:** ${meetLink}\n`;
        }

        return message.reply(confirmationMessage);
    } catch (error) {
        console.error("Error saving reminder:", error);
        return message.reply(
            "There was an error scheduling your meeting. Please try again later."
        );
    }
}
