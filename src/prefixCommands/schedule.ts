import { Message,EmbedBuilder } from "discord.js";
import { reminderHandler } from "..";
import { parseDateTime } from "../lib/utils";
import Event from "../schemas/event";

export default async function scheduleCommand(message: Message) {
    if (message.author.bot) return;

    const args = message.content.split(" ").slice(1);
    if (args.length == 0) {
        const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("📅 How to Schedule a Meeting")
        .setDescription(
            "To schedule a meeting, use the following format:\n" +
            "\`!schedule \"Title of the Meeting\" YYYY-MM-DD HH:MM @Role [Optional: Description] [Optional: Google Meet Link]\`"
        )
        .addFields({
            name: "Example:",
            value: "\`!schedule \"Team Sync\" 2023-10-10 14:30 @Developers \"Weekly team sync meeting\" https://meet.google.com/abc-xyz\`"
        })
        .setFooter({ text: "Use the correct format to schedule a meeting." });

    return message.reply({ embeds: [embed] });
    }

    const remainingArgs = args.join(" ");
    const regex =
/"([^"]+)"\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+((?:<@&\d+>|<@!?\d+>|@everyone|@here)(?:\s+(?:<@&\d+>|<@!?\d+>|@everyone|@here))*)(?:\s+"([^"]*)")?(?:\s+(https?:\/\/\S+))?/; 
   const match = remainingArgs.match(regex);

   // handle when there is no role or user , and i think this place is better for it
   if (message.mentions.roles.size === 0 && message.mentions.users.size === 0) {
        return message.reply(
            {
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle("❌ Invalid Command Format")
                        .setDescription("You must mention at least one role or user to schedule a meeting.")
                ]
            })
   }

    if (match) {
        const title = match[1];
        const date = match[2];
        const time = match[3];
        const role = match[4].split(/\s+/);// i don't need this actually
        const description = match[5] || null;
        const meetLink = match[6] || null;

        const timezone = "America/New_York";
        const dateTime = parseDateTime(date, time, timezone);

        if (isNaN(dateTime.getTime())) {
            return message.reply(
                {
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle("❌ Invalid Date/Time Format")
                            .setDescription("Please use YYYY-MM-DD HH:mm format.")
                    ]
                }
            );
        }
        console.log(message.mentions.roles.map(role => role.name));

        let mentionedRoles: any = message.mentions.roles.map((role) =>
            role.toString()
        );
        const mentionedUsers = message.mentions.users.map(user => user.tag);

       /* if (mentionedRoles.length === 0) {
            mentionedRoles = role;
        }*/

        const scheduleData = {
            title,
            dateTime,
            roleIds: message.mentions.roles.map((role) => role.id),
            rolename: mentionedRoles,
            username: mentionedUsers,
            description,
            meetLink,
        };

        insertReminder(scheduleData, message);
        return;
    } else {
        return message.reply(
            {
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle("❌ Invalid Command Format")
                        .setDescription( "Your command format seems to be incorrect. Please check the following:\n" +
                            "- Is the meeting title enclosed in double quotes?\n" +
                            "- Is the date in YYYY-MM-DD format?\n" +
                            "- Is the time in HH:MM format?\n" +
                            "- Did you mention at least one role or participant correctly?\n\n" +
                            "use this format: `!schedule \"Title of the Meeting\" YYYY-MM-DD HH:MM @Role [Optional: Description] [Optional: Google Meet Link]\`")
                ]
            }
        );
    }
}

async function insertReminder(
    scheduleData: {
        title: string;
        dateTime: Date;
        roleIds: string[];
        rolename: string[] | string;
        username:string[] | string;
        description: string | null;
        meetLink: string | null;
    },
    message: Message
) {
    const { title, dateTime, rolename,username, description, meetLink } = scheduleData;

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
        const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Meeting Scheduled Successfully!")
        .addFields(
            { name: "📌 Title", value: title },
            {
                name: "🗓 Date & Time",
                value: dateTime.toLocaleString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                }),
            },
            { name: "🏷️ Roles", value: Array.isArray(rolename) && rolename.length > 0
                  ? rolename.join(", ") : "None" },
            { 
                name: "👥 Participants", 
                value: Array.isArray(username) && username.length > 0 
                  ? username.join(", ") 
                  : "None" 
              }
           // { name: "👥 Users", value: Array.isArray(username) ? username.join(", ") : username }
        );



        
        // this is the previous without the embdes

      /*  let confirmationMessage = `
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
    `; */

    

        if (description) {
            embed.addFields({ name: "📝 Description", value: description });
        }

        if (meetLink) {
            embed.addFields({ name: "🔗 Google Meet Link", value: meetLink });
        }

        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error("Error saving reminder:", error);
        return message.reply(
            "There was an error scheduling your meeting. Please try again later."
        );
    }
}
