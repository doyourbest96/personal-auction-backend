import { Server } from "socket.io";

export const initializeSocket = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("join_auction", (auctionId: string) => {
      socket.join(auctionId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  return io;
};
