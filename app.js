import express from "express";
import { configDotenv } from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import cors from "cors";
import { connectDB } from "./config/db.js";

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

// ================= SOCKET =================
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

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/invitations", invitationRotues);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/message", messageRoutes);

// ================= SOCKET LOGIC =================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // =================================================
  // 🔵 1-1 CHAT (WHATSAPP STYLE)
  // =================================================

  // user join personal room
  socket.on("join_room", (userId) => {
    if (!userId) return;

    socket.join(userId.toString());

    console.log("User joined room:", userId);
  });

  // send message
  socket.on("send_message", (data) => {
    if (!data?.receiverId) return;

    const message = {
      senderId: data.senderId,
      receiverId: data.receiverId,
      message: data.message,
      messageId: data.messageId,
      status: "sent",
      createdAt: new Date(),
    };

    // send to receiver
    io.to(data.receiverId.toString()).emit("receive_message", message);

    // DELIVERY STATUS (✔✔ delivered)
    io.to(data.receiverId.toString()).emit("message_delivered", {
      messageId: data.messageId,
      status: "delivered",
    });
  });

  // READ STATUS (✔✔ blue tick)
  socket.on("message_read", (data) => {
    const { messageId, senderId } = data;

    io.to(senderId.toString()).emit("message_read_update", {
      messageId,
      status: "read",
    });
  });

  // =================================================
  // 🟢 GROUP CHAT
  // =================================================

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

  // =================================================
  // DISCONNECT
  // =================================================

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ================= SERVER =================
const PORT = process.env.PORT || 3200;

server.listen(PORT, () => {
  console.log("Server running on", PORT);
});