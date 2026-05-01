import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

// create group
export const createGroup = async (req, res) => {
  try {
    const { groupName, participants } = req.body;

    if (!groupName || !participants) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (participants.length < 1) {
      return res.status(400).json({ message: "At least 1 participant required" });
    }

    const allUsers = [...participants, req.user._id.toString()];
    const uniqueUsers = [...new Set(allUsers)];

    const group = await Chat.create({
      groupName,
      participants: uniqueUsers,  
      admin: req.user._id,
      isGroupChat: true,
    }); 
    res.status(201).json(group);
    
  } catch (err) {
    console.log("Create group error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// get my groups
export const getMyGroups = async (req, res) => {
  try {
    const groups = await Chat.find({
      participants: req.user._id,
      isGroupChat: true
    }).populate("participants", "name email");

    res.json(groups);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};


//search group
export const searchGroups = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const groups = await Chat.find({
      participants: req.user._id,
      groupName: { $regex: query, $options: "i" },
      isGroupChat: true
    }).populate("participants", "name email");

    return res.json(groups);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};


// add user to group
export const addUserToGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const group = await Chat.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // only admin can add
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can add users" });
    }

    // avoid duplicate
    if (group.participants.some(p => p.toString() === userId.toString())) {
      return res.json({ message: "User already in group" });
    }

    group.participants.push(userId);
    await group.save();

    res.json(group);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};


//delete group

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Chat.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // only admin can delete
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can delete group" });
    }

    await Message.deleteMany({ chat: groupId });
    await Chat.findByIdAndDelete(groupId);

    res.json({ message: "Group deleted successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};