import { Server } from "socket.io";
import User from "./models/User.js"

let onlineUsers = new Map();
export { onlineUsers };

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // ✅ Add user + join personal room
    socket.on("addUser", (userId) => {
      if (!userId) return;

      onlineUsers.set(userId.toString(), socket.id);

      // 🔥 IMPORTANT: join personal room
      socket.join(userId.toString());

      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });

    // ✅ Join chat room
    socket.on("joinChat", (chatId) => {
      if (!chatId) return;
      socket.join(chatId.toString());
      console.log("Joined chat:", chatId);
    });

    // ✅ Typing (ROOM BASED FIX)
    socket.on("typing", (data) => {
      if (!data?.receiverId) return;

      io.to(data.receiverId.toString()).emit("showTyping", {
        senderId: data.senderId,
      });
    });

    // ✅ Stop typing
    socket.on("stopTyping", (data) => {
      if (!data?.receiverId) return;

      io.to(data.receiverId.toString()).emit("hideTyping", {
        senderId: data.senderId,
      });
    });


    // ✅ Disconnect
    socket.on("disconnect", async() => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);

          await User.findByIdAndUpdate(userId, {
            lastSeen: new Date(),
          });

          io.emit("onlineUsers", Array.from(onlineUsers.keys()));
          break;
        }
      }

      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};