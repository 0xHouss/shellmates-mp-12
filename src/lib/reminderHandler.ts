import { Client, TextChannel } from "discord.js";
import Reminder from "../schemas/reminder"; 
import { connectToDatabase } from "./db"; 

export default async function handleReminder(client: Client, reminder: any) {
  try {
    const now = new Date();
    const leadTimeMs = reminder.leadTimeMs || 10 * 60 * 1000; // Default: 10 min
    const reminderTime = new Date(reminder.date).getTime() - leadTimeMs;
    const timeUntilReminder = reminderTime - now.getTime();

    if (timeUntilReminder > 0) {
      setTimeout(() => sendReminder(client, reminder), timeUntilReminder);
    } else {
      console.warn(`Reminder "${reminder.title}" is overdue. Skipping...`);
    }
  } catch (error) {
    console.error("Error handling a reminder:", error);
  }
}

async function sendReminder(client: Client, reminder: any) {
  try {
    const channel = client.channels.cache.get(reminder.channelId) as TextChannel;

    if (!channel) {
      console.error(`Channel with ID ${reminder.channelId} not found.`);
      return;
    }

    const leadTimeMinutes = (reminder.leadTimeMs || 10 * 60 * 1000) / (60 * 1000);
    await channel.send(
      `🔔 Reminder: "${reminder.title}" starts in ${leadTimeMinutes} minutes!`
    );

    // Mark the reminder as "Notified" in the database
    await Reminder.findByIdAndUpdate(reminder._id, { status: "Notified" });
  } catch (error) {
    console.error("Error sending reminder:", error);
  }
}

// Function to fetch and process all pending reminders when the bot starts
export async function processPendingReminders(client: Client) {
  try {
    // Establish database connection
    await connectToDatabase();

    const now = new Date();
    const pendingReminders = await Reminder.find({
      date: { $gte: now },
      status: "Pending",
    });

    for (const reminder of pendingReminders) {
      await handleReminder(client, reminder);
    }
  } catch (error) {
    console.error("Error processing pending reminders:", error);
  }
}
