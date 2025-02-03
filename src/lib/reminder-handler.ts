import { EmbedBuilder, TextChannel } from "discord.js";
import { bot } from "..";
import EventModal, { IEvent } from "../schemas/event";
import { removeDuplicates, sleep } from "./utils";

export class ReminderHandler {
    async handle(event: IEvent) {
        try {
            let now = new Date();
            const leadTimeMinutes = event.leadTimeMs / 60 / 1000;

            const reminderTime = new Date(event.datetime.getTime() - event.leadTimeMs);

            let timeToWait = reminderTime.getTime() - now.getTime();

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

                    await channel.send({
                        content: event.roles.map(roleId => `<@&${roleId}>`).concat(event.users.map(userId => `<@${userId}`)).join(" "),
                        embeds: [reminderEmbed]
                    });
                } else {
                    let participantsIds = event.users;

                    for (const roleId of event.roles) {
                        const role = await bot.client.guilds.cache.get(event.guildId)!.roles.fetch(roleId);

                        if (!role) {
                            console.error(`Role with ID ${roleId} not found.`);
                            continue;
                        }

                        participantsIds.push(...role.members.map(member => member.id));
                    }

                    participantsIds = removeDuplicates(participantsIds);

                    for (const userId of participantsIds) {
                        const user = await bot.client.users.fetch(userId);

                        try {
                            await user.send({ embeds: [reminderEmbed] });
                        } catch (error) { }
                    }
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

                    await channel.send({
                        content: event.roles.map(roleId => `<@&${roleId}>`).concat(event.users.map(userId => `<@${userId}>`)).join(" "),
                        embeds: [eventEmbed]
                    });
                } else {
                    let participantsIds = event.users;

                    for (const roleId of event.roles) {
                        const role = await bot.client.guilds.cache.get(event.guildId)!.roles.fetch(roleId);
                        console.log(role, roleId);

                        if (!role) {
                            console.error(`Role with ID ${roleId} not found.`);
                            continue;
                        }

                        console.log(role.members.map(member => member.id));

                        participantsIds.push(...role.members.map(member => member.id));
                    }

                    participantsIds = removeDuplicates(participantsIds);

                    for (const userId of participantsIds) {
                        const user = await bot.client.users.fetch(userId);

                        try {
                            await user.send({ embeds: [eventEmbed] });
                        } catch (error) { }
                    }
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