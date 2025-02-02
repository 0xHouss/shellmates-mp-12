import { EmbedBuilder, TextChannel } from "discord.js";
import { bot } from "..";
import EventModal, { IEvent } from "../schemas/event";
import { sleep } from "./utils";

export class ReminderHandler {
    async handle(event: IEvent) {
        try {
            let now = new Date();
            const leadTimeMinutes = event.leadTimeMs / 60 / 1000;

            const reminderTime = new Date(event.datetime.getTime() - event.leadTimeMs);

            let timeToWait = reminderTime.getTime() - now.getTime();

            const reminderEmbed = new EmbedBuilder()
                .setTitle(`🔔 Reminder: "${event.title}" starts in ${leadTimeMinutes} minutes!`)
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

            if (timeToWait > 0) {
                await sleep(timeToWait);

                const eventCheck = await EventModal.findById(event._id);

                if (!eventCheck || eventCheck.status !== "Pending")
                    return;

                if (event.channelId) {
                    const channel = bot.client.channels.cache.get(event.channelId) as TextChannel;

                    if (!channel) {
                        console.error(`Channel with ID ${event.channelId} not found.`);
                        return;
                    }

                    await channel.send({ embeds: [reminderEmbed] });
                } else {
                    const user = await bot.client.users.fetch(event.userId)

                    await user.send({ embeds: [reminderEmbed] });
                }
            }

            now = new Date();
            timeToWait = event.datetime.getTime() - now.getTime();

            if (timeToWait > 0) {
                await sleep(timeToWait);

                const eventCheck = await EventModal.findById(event._id);

                if (!eventCheck || eventCheck.status !== "Pending")
                    return;

                if (event.channelId) {
                    const channel = bot.client.channels.cache.get(event.channelId) as TextChannel;

                    if (!channel) {
                        console.error(`Channel with ID ${event.channelId} not found.`);
                        return;
                    }

                    await channel.send({ embeds: [eventEmbed] });
                } else {
                    const user = await bot.client.users.fetch(event.userId)

                    await user.send({ embeds: [eventEmbed] });
                }
            }

            // Mark the event as "Notified" in the database
            event.status = "Notified";
            await event.save();
        } catch (error) {
            console.error("Error handling a reminder:", error);
        }
    }

    async initReminders() {
        try {
            const pendingReminders = await EventModal.find({
                datetime: { $gt: new Date() },
                status: "Pending",
            });

            console.log(`Processing ${pendingReminders.length} pending reminders...`);

            pendingReminders.forEach(this.handle)
        } catch (error) {
            console.error("Error processing pending reminders:", error);
        }
    }
}