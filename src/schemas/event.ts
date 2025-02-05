import mongoose, { Document, InferSchemaType } from "mongoose";


const EventSchema = new mongoose.Schema({
    // Required
    userId: { type: String, required: true, },
    guildId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: "Pending", enum: ["Pending", "Notified", "Canceled"] },
    calendarEventId: { type: String, required: true },
    title: { type: String, required: true },
    datetime: { type: Date, required: true },
    leadTimeMs: { type: Number, default: 10 * 60 * 1000 },

    // Optional
    description: String,
    channelId: String,
    meetLink: String,
    roles: [String],
    users: [String],
});

export type IEvent = Document & InferSchemaType<typeof EventSchema>;

const EventModal = mongoose.model<IEvent>("Event", EventSchema);
export default EventModal;

