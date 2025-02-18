import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import http, { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import morgan from "morgan";
import { Auction } from "./models/Auction";
import { Bid } from "./models/Bid";
import { User } from "./models/User";
import authRoutes from "./routes/auth";
import auctionRoutes from "./routes/auction";
import bidRoutes from "./routes/bid";
import notificationRoutes from "./routes/notification";

interface CustomRequest extends Request {
  io: Server;
}

dotenv.config();

const app = express();
app.use(compression());
app.use(helmet());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

// Attach io to app
app.use((req: CustomRequest, res: Response, next: NextFunction) => {
  req.io = io;
  next();
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

mongoose.connection.once("open", () => {
  Auction.createIndexes();
  Bid.createIndexes();
  User.createIndexes();
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    dbState: mongoose.STATES[mongoose.connection.readyState],
    timestamp: new Date(),
  });
});

// Error handling middleware
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

app.use((err: Error, req: express.Request, res: express.Response) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// Server startup
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// Database event listeners
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
