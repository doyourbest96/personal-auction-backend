import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["unread", "read"],
    default: "unread",
    index: true,
  },
  type: {
    type: String,
    enum: ["system", "message", "alert"],
    default: "system",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Notification = mongoose.model("Notification", notificationSchema);
