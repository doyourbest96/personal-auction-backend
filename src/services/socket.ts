import { Server } from "socket.io";
import { Server as HttpServer } from "http";

export const initializeSocket = (server: HttpServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_auction", (auctionId: string) => {
      socket.join(auctionId);
      console.log(`User ${socket.id} joined auction ${auctionId}`);
    });

    socket.on("leave_auction", (auctionId: string) => {
      socket.leave(auctionId);
      console.log(`User ${socket.id} left auction ${auctionId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};
