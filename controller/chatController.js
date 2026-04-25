import User from "../models/User.js"
import Chat from "../models/Chat.js"

export const createOrGetPrivateChat = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    if (currentUserId.toString() === receiverId) {
      return res.status(400).json({ message: "You cannot chat with yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    let chat = await Chat.findOne({
      isGroupChat: false,
      participants: { $all: [currentUserId, receiverId] },
    })
      .populate("participants", "-password")
      .populate("lastMessage");

    if (chat) {
      return res.status(200).json({ chat });
    }

    chat = await Chat.create({
      participants: [currentUserId, receiverId],
      isGroupChat: false,
    });

    chat = await Chat.findById(chat._id)
      .populate("participants", "-password")
      .populate("lastMessage");

    return res.status(201).json({ chat });
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};


                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                              