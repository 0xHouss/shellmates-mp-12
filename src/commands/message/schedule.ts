import { EmbedBuilder, Message, Role, User } from "discord.js";
import { ObjectId } from "mongoose";
import { googleCalendar, reminderHandler } from "../..";
import config from "../../lib/config";
import { removeDuplicates } from "../../lib/utils";
import EventModal from "../../schemas/event";
import UserModal from "../../schemas/user";
import MessageCommand from "../../templates/MessageCommand";
import { parseDatetime, parseLeadTime } from "../slash/schedule";

export default new MessageCommand({
    name: "schedule",
    description: "Schedule a new meeting",
    async execute(message: Message, args: string[]) {
        if (!args.length) {
            const embed = new EmbedBuilder()
                .setTitle("📅 How to Schedule a Meeting")
                .setDescription(
                    "To schedule a meeting, use the following format:\n" +
                    `\`\`\`${config.BOT_PREFIX}schedule "Title of the Meeting" "date and time" [Optional: Description] [Optional: Lead Time] [Optional: Google Meet Link] [Optional: Mentions]\`\`\``
                )
                .addFields({
                    name: "Example:",
                    value: `\`\`\`${config.BOT_PREFIX}schedule "Team Sync" "in 1 hour" "Weekly team sync meeting" "10 mins" https://meet.google.com/abc-xyz @johndoe @admins\`\`\``
                })
                .addFields({
                    name: "Date and time formats:",
                    value: "You can use 'dd-mm-yyyy HH:MM', 'dd/mm/yyyy HH:MM', 'in X [unit]' or 'in X [unit]s' formats."
                })
                .addFields({
                    name: "Note:",
                    value: "If you want to leave an optional argument empty you need to put empty quotes."
                })
                .setColor("Orange");

            return await message.reply({ embeds: [embed] });
        }

        const [title, datetimeStr, description, leadtimeStr, meetLink] = args;

        const user = await UserModal.findOne({ userId: message.author.id });

        const timezone = user?.timezone;
        const datetime = parseDatetime(datetimeStr);
        const leadTimeMs = parseLeadTime(leadtimeStr);

        if (!datetime) {
            const embed = new EmbedBuilder()
                .setTitle("Invalid date & time format !")
                .setDescription("Please use 'dd-mm-yyyy HH:MM', 'dd/mm/yyyy HH:MM', 'in X [unit]' or 'in X [unit]s' format.")
                .setColor("Red");

            return await message.reply({ embeds: [embed] });
        }


        return await saveEvent({
            userId: message.author.id,
            title,
            datetime,
            description: description || null,
            leadTimeMs: leadTimeMs || 10 * 60 * 1000,
            meetLink: meetLink || null,
            roles: removeDuplicates(message.mentions.roles.map(role => role)),
            users: removeDuplicates(message.mentions.users.map(user => user).concat(message.author))
        }, message);
    },
});

async function saveEvent(
    event: {
        userId: string;
        title: string;
        datetime: Date;
        description: string | null;
        leadTimeMs: number | null;
        meetLink: string | null;
        roles: Role[];
        users: User[];
    },
    message: Message
) {
    const reply = await message.reply("Scheduling your event...");

    try {
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

        const newEvent = new EventModal({
            title: event.title,
            datetime: event.datetime,
            description: event.description,
            meetLink: event.meetLink,
            leadTimeMs: event.leadTimeMs,
            userId: event.userId,
            roles: event.roles.map(role => role.id),
            users: event.users.map(user => user.id),
            calendarEventId: calendarEvent.id
        });

        const res = await newEvent.save();

        const embed = new EmbedBuilder()
            .setTitle("✅ Meeting Scheduled Successfully!")
            .addFields(
                { name: "📌 Title", value: event.title },
                {
                    name: "🗓 Date & Time",
                    value: event.datetime.toString(),
                },
                { name: "🆔 ID", value: (res._id as ObjectId).toString() },
            )
            .setColor("Green");

        if (event.description)
            embed.addFields({ name: "📝 Description", value: event.description });

        if (event.meetLink)
            embed.addFields({ name: "🔗 Google Meet Link", value: event.meetLink });

        if (event.roles.length || event.users.length) {
            let mentions = "";

            if (event.roles.length) {
                mentions += event.roles.map(role => `<@&${role.id}>`).join(" ");
            }

            if (event.users.length) {
                mentions += event.users.map(user => `<@${user.id}>`).join(" ");
            }

            embed.addFields({ name: "👥 Participants", value: mentions });
        }

        await reply.edit({ embeds: [embed] });

        reminderHandler.handle(res);
    } catch (error) {
        console.error("Error saving event:", error);

        const embed = new EmbedBuilder()
            .setTitle("Error Scheduling Event")
            .setDescription("There was an error scheduling your event. Please contact staff. ```" + error + "```")
            .setColor("Red");

        await reply.edit({ embeds: [embed] });
    }
}