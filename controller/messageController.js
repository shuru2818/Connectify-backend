import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

// =======================
// ✅ SEND MESSAGE
// =======================
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId, content } = req.body;
    const file = req.file;

    if (!chatId) {
      return res.status(400).json({ message: "chatId required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (!content && !file) {
      return res.status(400).json({ message: "Message or file required" });
    }

    let type = "text";
    let fileUrl = null;

    if (file) {
      type = file.mimetype?.startsWith("image/") ? "image" : "file";
      fileUrl = file.path;

      if (!fileUrl) {
        throw new Error("File upload failed");
      }
    }

    let message = await Message.create({
      sender: userId,
      chat: chatId,
      content: content || "",
      type,
      fileUrl,
    });

    // 🔥 IMPORTANT: populate sender (frontend ke liye)
    message = await message.populate("sender", "username email");

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
    });

    // 🔥 SAFE EMIT
    const io = req.app.get("io");
    if (io) {
      io.to(chatId.toString()).emit("receiveMessage", message);
    }

    return res.status(201).json(message);

  } catch (err) {
    console.log("🔥 SEND ERROR:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// =======================
// ✅ GET MESSAGES
// =======================
export const getMessagesByChatId = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "username email")
      .sort({ createdAt: 1 });

    res.json(messages);

  } catch (error) {
    console.log("🔥 GET ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// ✅ MARK AS READ
// =======================
export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Message.updateMany(
      {
        chat: chatId,
        "readBy.user": { $ne: userId },
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date(),
          },
        },
      }
    );

    const io = req.app.get("io");
    if (io) {
      io.to(chatId.toString()).emit("messagesSeen", {
        chatId,
        userId,
      });
    }

    res.json({ message: "Messages marked as read" });

  } catch (error) {
    console.log("🔥 READ ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// ✅ DELETE MESSAGE
// =======================
export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    // 🔥 guard for invalid id (temp ids etc.)
    if (!messageId || messageId.startsWith("temp-")) {
      return res.status(400).json({ message: "Invalid messageId" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Message.findByIdAndDelete(messageId);

    const io = req.app.get("io");
    if (io) {
      io.to(message.chat.toString()).emit("messageDeleted", {
        messageId,
      });
    }

    res.json({ message: "Message deleted" });

  } catch (error) {
    console.log("🔥 DELETE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// ✅ UPDATE MESSAGE
// =======================
export const updateMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;
    const { content } = req.body;

    // 🔥 guard for temp ids
    if (!messageId || messageId.startsWith("temp-")) {
      return res.status(400).json({ message: "Invalid messageId" });
    }

    if (!content) {
      return res.status(400).json({ message: "Content required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    message.content = content;
    message.edited = true;

    await message.save();

    const io = req.app.get("io");
    if (io) {
      io.to(message.chat.toString()).emit("messageUpdated", message);
    }

    res.json(message);

  } catch (error) {
    console.log("🔥 UPDATE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};