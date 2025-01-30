import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
    id: string,
    timezone?: Date,
    createdAt: Date,
    email: string,
    score: number,
};

const UserSchema = new mongoose.Schema({
    id: String,
    timezone: { type: String, require: false, default: null },
    createdAt: Date,
    email: String,
    score: Number,
});

export default mongoose.model<IUser>("User", UserSchema);


