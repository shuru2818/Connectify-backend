import express from "express";
import { configDotenv } from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import cors from "cors";
import { connectDB } from "./config/db.js";
import Message from "./models/Message.js";
import Chat from "./models/Chat.js";
import Notification from "./models/Notification.js";
// import Group from "./models/Group.js"; 

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import invitationRotues from "./routes/invitationRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

configDotenv();

const app = express();
const server = createServer(app);

// SOCKET
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/invitations", invitationRotues);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/message", messageRoutes);

// SOCKET LOGIC
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

   // 1-1 CHAT
 
  socket.on("join_room", (userId) => {
    if (!userId) return;
    socket.join(userId.toString());
    console.log("User joined room:", userId);
  });

  socket.on("send_message", async (data) => {
    try {
      if (!data?.receiverId || !data?.senderId || !data?.message) return;

      let chat = await Chat.findOne({
        participants: { $all: [data.senderId, data.receiverId] },
        isGroup: false,
      });

      if (!chat) {
        chat = await Chat.create({
          participants: [data.senderId, data.receiverId],
          isGroup: false,
        });
      }

      const dbMessage = await Message.create({
        sender: data.senderId,
        chat: chat._id,
        content: data.message,
        status: "sent",
      });

      chat.lastMessage = dbMessage._id;
      chat.messages.push(dbMessage._id);
      await chat.save();

      await Notification.create({
        recipient: data.receiverId,
        type: "message",
        sender: data.senderId,
        chat: chat._id,
        message: dbMessage._id,
      });

      const message = {
        senderId: data.senderId,
        receiverId: data.receiverId,
        message: data.message,
        messageId: data.messageId,
        status: "sent",
        createdAt: new Date(),
        _id: dbMessage._id,
      };

      io.to(data.receiverId.toString()).emit("receive_message", message);

      io.to(data.receiverId.toString()).emit("message_delivered", {
        messageId: data.messageId,
        status: "delivered",
      });

    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("message_read", (data) => {
    const { messageId, senderId } = data;

    io.to(senderId.toString()).emit("message_read_update", {
      messageId,
      status: "read",
    });
  });

   // GROUP CHAT
 
  socket.on("joinGroup", (groupId) => {
    if (!groupId) return;

    socket.join(groupId.toString());
    console.log("Joined group:", groupId);
  });

  socket.on("sendGroupMessage", (data) => {
    if (!data?.groupId) return;

    const message = {
      groupId: data.groupId,
      senderId: data.senderId,
      text: data.text,
      createdAt: new Date(),
      status: "sent",
    };

    io.to(data.groupId.toString()).emit("receiveGroupMessage", message);
  });

  //DELETE GROUP 
   socket.on("deleteGroup", async ({ groupId, userId }) => {
  try {
    const group = await Chat.findById(groupId);

    if (!group) return;

    if (group.admin.toString() !== userId) {
      console.log("Not admin");
      return;
    }

    await Chat.findByIdAndDelete(groupId);

    console.log("Group deleted from DB");

    io.emit("groupDeleted", groupId);

  } catch (err) {
    console.log(err);
  }
});

   // DISCONNECT
 
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3200;

server.listen(PORT, () => {
  console.log("Server running on", PORT);
});