interface IBid extends mongoose.Document {
  amount: number;
  auction: mongoose.Types.ObjectId;
  bidder: mongoose.Types.ObjectId;
  timestamp: Date;
  status: "active" | "retracted" | "accepted";
  history: Array<{
    amount: number;
    modifiedAt: Date;
  }>;
}
