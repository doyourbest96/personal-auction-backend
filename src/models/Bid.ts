import mongoose, { Schema, Document, Model, Types } from "mongoose";

interface IBidHistory {
  amount: number;
  modifiedAt: Date;
}

export interface IBid extends Document {
  amount: number;
  auction: Types.ObjectId;
  bidder: Types.ObjectId;
  status: "active" | "retracted" | "accepted";
  history: IBidHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const BidHistorySchema: Schema = new Schema(
  {
    amount: { type: Number, required: true },
    modifiedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const BidSchema: Schema = new Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    auction: {
      type: Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
    },
    bidder: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "retracted", "accepted"],
      default: "active",
    },
    history: [BidHistorySchema],
  },
  { timestamps: true }
);

export const Bid: Model<IBid> = mongoose.model<IBid>("Bid", BidSchema);
