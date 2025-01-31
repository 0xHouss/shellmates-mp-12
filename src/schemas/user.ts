import mongoose, { Document, InferSchemaType } from "mongoose";

const UserSchema = new mongoose.Schema({
    timezone: String,
    createdAt: { type: Date, default: Date.now },
    email: String,
});

export type IUser = Document & InferSchemaType<typeof UserSchema>;

const UserModal = mongoose.model<IUser>("User", UserSchema);
export default UserModal;

