import { EmbedBuilder, Message } from "discord.js";
import config from "../../lib/config";
import { parseDateTime, parseLeadTime, removeDuplicates, saveEvent } from "../../lib/utils";
import UserModal from "../../schemas/user";
import MessageCommand from "../../templates/MessageCommand";

export default new MessageCommand({
    name: "schedule",
    description: "Schedule a new meeting",
    async execute(message: Message, args: string[]) {
        try {
            if (!message.guildId) return;

            if (!args.length) {
                const embed = new EmbedBuilder()
                    .setTitle("📅 How to Schedule a Meeting")
                    .setDescription(
                        "To schedule a meeting, use the following format:\n" +
                        `\`\`\`${config.BOT_PREFIX}schedule "Title of the Meeting" "date and time" [Optional: Description] [Optional: Lead Time] [Optional: Google Meet Link] [Optional: Announcement Channel] [Optional: Mentions]\`\`\``
                    )
                    .addFields({
                        name: "Example:",
                        value: `\`\`\`${config.BOT_PREFIX}schedule "Team Sync" "in 1 hour" "Weekly team sync meeting" "10 mins" https://meet.google.com/abc-xyz #events @johndoe @admins\`\`\``
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

                return message.reply({ embeds: [embed] });
            }

            const [title, datetimeStr, description, leadtimeStr, meetLink] = args;

            const user = await UserModal.findOne({ userId: message.author.id });

            const timezone = user?.timezone || undefined;
            const datetime = parseDateTime(datetimeStr);
            const leadTimeMs = parseLeadTime(leadtimeStr);

            if (!datetime) {
                const embed = new EmbedBuilder()
                    .setTitle("Invalid date & time format !")
                    .setDescription("Please use 'dd-mm-yyyy HH:MM', 'dd/mm/yyyy HH:MM', 'in X [unit]' or 'in X [unit]s' format.")
                    .setColor("Red");

                return message.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setTitle("Scheduling Event...")
                .setColor("Yellow")

            const reply = await message.reply({ embeds: [embed] });

            try {
                const embed = await saveEvent({
                    userId: message.author.id,
                    guildId: message.guildId,
                    title,
                    datetime,
                    timezone,
                    description: description,
                    leadTimeMs: leadTimeMs || 10 * 60 * 1000,
                    meetLink,
                    roles: removeDuplicates(message.mentions.roles.map(role => role)),
                    users: removeDuplicates(message.mentions.users.map(user => user).concat(message.author)),
                    channelId: message.mentions.channels.first()?.id
                });
                await reply.edit({ embeds: [embed] });
            } catch (error) {
                console.error("Error saving event:", error);

                const embed = new EmbedBuilder()
                    .setTitle("Error Scheduling Event")
                    .setDescription("There was an error scheduling your event. Please contact staff. ```" + error + "```")
                    .setColor("Red");

                await reply.edit({ embeds: [embed] });
            }
        } catch (error) {
            console.error("Error scheduling event:", error);

            const embed = new EmbedBuilder()
                .setTitle("Error Scheduling Event")
                .setDescription("There was an error scheduling your event. Please contact staff. ```" + error + "```")
                .setColor("Red");

            return message.reply({ embeds: [embed] });
        }
    },
});