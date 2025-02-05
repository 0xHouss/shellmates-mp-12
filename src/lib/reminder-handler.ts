import { EmbedBuilder, TextChannel } from "discord.js";
import { bot } from "..";
import EventModal, { IEvent } from "../schemas/event";
import { getReminderTime, removeDuplicates, sleep } from "./utils";

async function waitAndSendEmbed(event: IEvent, embed: EmbedBuilder, timeToWait: number) {
    if (timeToWait <= 0) return;

    await sleep(timeToWait);

    const eventCheck = await EventModal.findById(event._id);
    if (!eventCheck || eventCheck.status !== "Pending") return;

    // Send reminder message to a text channel if specified
    if (event.channelId) {
        const channel = bot.client.channels.cache.get(event.channelId) as TextChannel;

        if (!channel)
            return console.error(`Channel with ID ${event.channelId} not found.`);

        await channel.send({
            content: event.roles.map(roleId => `<@&${roleId}>`).concat(event.users.map(userId => `<@${userId}>`)).join(" "),
            embeds: [embed]
        });
    } else {
        // If no text channel is specified, DM all participants

        let participantsIds = event.users;

        // Add all members of the specified roles to the list of participants
        for (const roleId of event.roles) {
            const role = await bot.client.guilds.cache.get(event.guildId)!.roles.fetch(roleId);

            if (!role) {
                console.error(`Role with ID ${roleId} not found.`);
                continue;
            }

            participantsIds.push(...role.members.map(member => member.id));
        }

        participantsIds = removeDuplicates(participantsIds);

        // Send the reminder to all participants
        for (const userId of participantsIds) {
            const user = await bot.client.users.fetch(userId);
            try {
                await user.send({ embeds: [embed] });
            } catch (error) {
                // If the user has DMs disabled skip
            }
        }
    }
}

export class ReminderHandler {
    async handle(event: IEvent) {
        try {
            let now = new Date();
            const leadTimeMinutes = event.leadTimeMs / 60 / 1000;

            // Calculate when the reminder should be sent
            const reminderTime = getReminderTime(event.datetime, event.leadTimeMs);
            let timeToWait = reminderTime.getTime() - now.getTime();

            // Create the reminder and event notification embeds
            const reminderEmbed = new EmbedBuilder()
                .setTitle(`🔔 The event **"${event.title}"** is starting in ${leadTimeMinutes} minutes!`)
                .setColor("Blue")
                .setTimestamp();

            const eventEmbed = new EmbedBuilder()
                .setTitle(`🎉 Event "${event.title}" is starting now!`)
                .setColor("Green")
                .setTimestamp();

            if (event.description) {
                reminderEmbed.setDescription(event.description);
                eventEmbed.setDescription(event.description);
            }

            if (event.meetLink) {
                reminderEmbed.addFields({ name: "Google Meet:", value: event.meetLink, inline: false });
                eventEmbed.addFields({ name: "Google Meet:", value: event.meetLink, inline: false });
            }

            // Wait until it's time to send the reminder
            await waitAndSendEmbed(event, reminderEmbed, timeToWait);

            // Wait until event start time to send the final notification
            now = new Date();
            timeToWait = event.datetime.getTime() - now.getTime();

            await waitAndSendEmbed(event, eventEmbed, timeToWait);

            // Mark the event as "Notified" in the database
            event.status = "Notified";
            await event.save();
        } catch (error) {
            console.error("Error handling a reminder:", error);
        }
    }

    async initReminders() {
        try {
            // Fetch all pending reminders that are scheduled for the future
            const pendingReminders = await EventModal.find({
                datetime: { $gt: new Date() },
                status: "Pending",
            });

            console.log(`Processing ${pendingReminders.length} pending reminders...`);

            // Initialize reminders for all pending events
            pendingReminders.forEach(this.handle);
        } catch (error) {
            console.error("Error processing pending reminders:", error);
        }
    }
}
