import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: "user" | "admin";
  createdAuctions: Types.ObjectId[];
  bids: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    createdAuctions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Auction",
        default: [],
      },
    ],
    bids: [
      {
        type: Schema.Types.ObjectId,
        ref: "Bid",
        default: [],
      },
    ],
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
