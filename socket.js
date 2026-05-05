import { Server } from "socket.io";
import Message from "./models/Message.js";

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
    socket.on("addUser", (userId) => {
      if (!userId) return;

      onlineUsers.set(userId.toString(), socket.id);
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });

    socket.on("joinChat", (chatId) => {
      if (!chatId) return;
      socket.join(chatId.toString());
    });

    socket.on("sendMessage", async (data) => {
      if (!data?.chatId || !data?.content || !data?.sender) return;

      const message = await Message.create({
        chat: data.chatId,
        content: data.content,
        sender: data.sender,
      });

      const fullMessage = await message.populate("sender", "username");

      const roomId = data.chatId.toString();

      io.to(roomId).emit("receiveMessage", {
        _id: fullMessage._id,
        chat: roomId,
        content: fullMessage.content,
        sender: fullMessage.sender,
        createdAt: fullMessage.createdAt,
      });
    });

    socket.on("typing", (data) => {
      const receiver = onlineUsers.get(data.receiverId?.toString());
      if (receiver) {
        io.to(receiver).emit("showTyping", {
          senderId: data.senderId,
        });
      }
    });

    socket.on("stopTyping", (data) => {
      const receiver = onlineUsers.get(data.receiverId?.toString());
      if (receiver) {
        io.to(receiver).emit("hideTyping", {
          senderId: data.senderId,
        });
      }
    });

    socket.on("markSeen", async (data) => {
      if (!data?.chatId || !data?.senderId) return;

      await Message.updateMany(
        {
          chat: data.chatId,
          sender: data.senderId,
          status: { $ne: "read" },
        },
        { $set: { status: "read" } },
      );

      const senderSocket = onlineUsers.get(data.senderId.toString());

      if (senderSocket) {
        io.to(senderSocket).emit("messagesSeen", {
          chatId: data.chatId,
        });
      }
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit("onlineUsers", Array.from(onlineUsers.keys()));
          break;
        }
      }
    });
  });

  return io;
};