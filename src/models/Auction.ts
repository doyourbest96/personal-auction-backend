import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAuction extends Document {
  title: string;
  description: string;
  startPrice: number;
  currentPrice: number;
  startTime: Date;
  endTime: Date;
  status: "active" | "closed";
  creator: Types.ObjectId;
  category: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AuctionSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    startPrice: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number, required: true, min: 0 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: { type: String, required: true },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Auction: Model<IAuction> = mongoose.model<IAuction>(
  "Auction",
  AuctionSchema
);
