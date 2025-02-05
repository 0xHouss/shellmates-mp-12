import mongoose, { Document, InferSchemaType } from "mongoose";
import { Timezone } from "../lib/utils";
import { zones as timezones} from "tzdata";

const timezoneValues = Object.keys(timezones) as Timezone[];

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    timezone: { type: String, enum: timezoneValues, required: false },
    createdAt: { type: Date, default: Date.now },
    email: String,
});

export type IUser = Document & InferSchemaType<typeof UserSchema>;

const UserModal = mongoose.model<IUser>("User", UserSchema);
export default UserModal;

