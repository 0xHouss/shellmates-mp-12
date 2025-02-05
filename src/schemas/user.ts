import mongoose, { Document, InferSchemaType } from "mongoose";
import { Timezone } from "../lib/utils";
import { zones as timezones} from "tzdata";

const timezoneValues = Object.keys(timezones) as Timezone[];

const UserSchema = new mongoose.Schema({
    // Required
    userId: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },

    // Optional
    timezone: { type: String, enum: timezoneValues, required: false },
    email: String,
});

export type IUser = Document & InferSchemaType<typeof UserSchema>;

const UserModal = mongoose.model<IUser>("User", UserSchema);
export default UserModal;