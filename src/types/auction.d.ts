interface IAuction extends mongoose.Document {
  title: string;
  description: string;
  startPrice: number;
  currentPrice: number;
  startTime: Date;
  endTime: Date;
  status: "active" | "closed";
  creator: mongoose.Types.ObjectId;
  category: string;
  images: string[];
}
