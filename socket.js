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
    console.log("User connected:", socket.id);

    // ========================
    // ADD USER
    // ========================
    socket.on("addUser", (userId) => {
      if (!userId) return;

      onlineUsers.set(userId.toString(), {
        socketId: socket.id,
      });

      io.emit("onlineUsers", Array.from(onlineUsers.keys()));

      io.emit("userStatus", {
        userId,
        status: "online",
      });
    });

    // ========================
    // SEND MESSAGE
    // ========================
  socket.on("sendMessage", (data) => {
  if (!data?.chatId) return;

  io.to(data.chatId.toString()).emit("receiveMessage", data);
});

//room
socket.on("joinChat", (chatId) => {
  if (!chatId) return;
  socket.join(chatId.toString());
  
});

    // ========================
    // MARK SEEN
    // ========================
    socket.on("markSeen", async (data) => {
      if (!data?.chatId || !data?.senderId) return;

      const { chatId, senderId } = data;

      try {
        await Message.updateMany(
          {
            chat: chatId,
            sender: senderId,
            status: { $ne: "read" },
          },
          { $set: { status: "read" } }
        );

        const senderSocket = onlineUsers.get(senderId.toString());

        if (senderSocket) {
          io.to(senderSocket.socketId).emit("messagesSeen", {
            chatId,
          });
        }
      } catch (err) {
        console.error("MARK SEEN ERROR:", err);
      }
    });

    // ========================
    // TYPING
    // ========================
    socket.on("typing", (data) => {
      if (!data?.receiverId || !data?.senderId) return;

      const receiver = onlineUsers.get(data.receiverId.toString());

      if (receiver) {
        io.to(receiver.socketId).emit("showTyping", {
          senderId: data.senderId,
        });
      }
    });

    // ========================
    // STOP TYPING
    // ========================
    socket.on("stopTyping", (data) => {
      if (!data?.receiverId || !data?.senderId) return;

      const receiver = onlineUsers.get(data.receiverId.toString());

      if (receiver) {
        io.to(receiver.socketId).emit("hideTyping", {
          senderId: data.senderId,
        });
      }
    });

    // ========================
    // DISCONNECT
    // ========================
    socket.on("disconnect", () => {
      for (const [userId, data] of onlineUsers.entries()) {
        if (data.socketId === socket.id) {
          onlineUsers.delete(userId);

          io.emit("onlineUsers", Array.from(onlineUsers.keys()));

          io.emit("userStatus", {
            userId,
            status: "offline",
          });

          break;
        }
      }
    });
  });

  return io;
};