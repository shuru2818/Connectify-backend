import express from "express";
import { configDotenv } from "dotenv";
import { createServer } from "http";
import cors from "cors";

import { connectDB } from "./config/db.js";
import { initSocket } from "./socket.js";

// ROUTES
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

// SOCKET INIT
const io = initSocket(server);
app.set("io", io);

// MIDDLEWARE
app.use(cors({
    origin: "https://connectify-frontend-rose.vercel.app",
    credentials: true,
  })
);

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

const PORT = process.env.PORT || 3200;

server.listen(PORT, () => {
  console.log("Server running on", PORT);
});