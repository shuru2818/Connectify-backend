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
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // check user in chat
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // create message
    let message = await Message.create({
      sender: userId,
      chat: chatId,
      content,
      status: "sent",
    });

    // update chat
    chat.lastMessage = message._id;
    chat.messages.push(message._id);
    await chat.save();

    // create notifications for other users
    const otherUsers = chat.participants.filter(
      (p) => p.toString() !== userId.toString(),
    );

    await Notification.insertMany(
      otherUsers.map((user) => ({
        user,
        chat: chatId,
        message: message._id,
      })),
    );

    // populate for frontend
    message = await Message.findById(message._id)
      .populate("sender", "name email")
      .populate("chat");

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessagesByChatId = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.body;

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
        $set: { status: "read" },
      },
    );

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
