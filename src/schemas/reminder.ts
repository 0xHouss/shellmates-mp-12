import mongoose, { Document } from "mongoose";

export type ReminderType = "Meet" | "Event" | "Notification";
export type ReminderStatus = "Pending" | "Notified" | "Canceled";

export interface IReminder extends Document {
    // auto generated
    id: string,
    createdAt: Date,
    status?: ReminderStatus,

    userId: string,

    // required
    title: string,
    date: Date,

    description?: string,
    leadTimeMs?: number,
    meetLink?: string,

    // optional
    channelId?: string,
    timezone?: string,
    type: ReminderType,
};

const ReminderSchema = new mongoose.Schema({
    // auto generated
    id: String,
    userId: { type: String, require: true, },
    channelId: String,
    createdAt: Date,
    status: { type: String, default: "Pending", enum: ["Pending", "Notified", "Canceled"] },

    // required
    title: String,
    date: Date,

    // optional
    description: { type: String, require: false, default: '' },
    meetLink: { type: String, require: false, default: '' },
    leadTimeMs: { type: Number, default: 0 },
    timezone: { type: String, require: false, default: null },
    type: { type: String, default: "Notification", enum: ["Meet", "Event", "Notification"] },
});

export default mongoose.model<IReminder>("Reminder", ReminderSchema);

