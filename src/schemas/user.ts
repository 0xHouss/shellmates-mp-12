import mongoose, { Document, InferSchemaType } from "mongoose";

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    timezone: String,
    createdAt: { type: Date, default: Date.now },
    email: String,
});

export type IUser = Document & InferSchemaType<typeof UserSchema>;

const UserModal = mongoose.model<IUser>("User", UserSchema);
export default UserModal;

