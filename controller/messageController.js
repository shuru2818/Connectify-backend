import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import Notification from "../models/Notification.js";

// SEND MESSAGE
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId, content } = req.body;

    if (!chatId || !content) {
      return res.status(400).json({ message: "chatId and content required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    if (!chat.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({ message: "Not allowed" });
    }

    let message = await Message.create({
      sender: userId,
      chat: chatId,
      content,
    });

    chat.lastMessage = message._id;
    await chat.save();

    message = await Message.findById(message._id)
      .populate("sender", "username email");

    const io = req.app.get("io");

    io.to(chatId.toString()).emit("receiveMessage", message);

    const receivers = chat.participants.filter(
      p => p.toString() !== userId.toString()
    );

    for (const receiverId of receivers) {
      const notification = await Notification.create({
        recipient: receiverId,
        sender: userId,
        type: "message",
        message: { text: content },
        chat: chatId,
      });

      io.to(receiverId.toString()).emit("newNotification", notification);
    }

    res.status(201).json(message);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET MESSAGES
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
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// MARK AS READ (FIXED + REALTIME)
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

    io.to(chatId.toString()).emit("messagesSeen", {
      chatId,
      userId,
    });

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE MESSAGE (REALTIME FIX)
export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Message.findByIdAndDelete(messageId);

    const io = req.app.get("io");

    io.to(message.chat.toString()).emit("messageDeleted", {
      messageId,
    });

    res.json({ message: "Message deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE MESSAGE
export const updateMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;
    const { content } = req.body;

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

    io.to(message.chat.toString()).emit("messageUpdated", message);

    res.json(message);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};