import mongoose, { Document, InferSchemaType } from "mongoose";


const EventSchema = new mongoose.Schema({
    // auto generated
    userId: { type: String, required: true, },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: "Pending", enum: ["Pending", "Notified", "Canceled"] },
    calendarEventId: { type: String, required: true },

    // required
    title: { type: String, required: true },
    datetime: { type: Date, required: true },
    leadTimeMs: { type: Number, default: 10 * 60 * 1000 },

    // optional
    description: String,
    channelId: String,
    meetLink: String,
});

export type IEvent = Document & InferSchemaType<typeof EventSchema>;

const EventModal = mongoose.model<IEvent>("Event", EventSchema);
export default EventModal;

