import Chat from "../models/Chat.js";

// create group
export const createGroup = async (req, res) => {
  try {
    const { groupName, participants } = req.body;

    console.log("Create group request:", { groupName, participants, userId: req.user._id });

    if (!groupName || !participants || participants.length === 0) {
      return res.status(400).json({ message: "All fields required" });
    }

    const group = await Chat.create({
      groupName,
      participants: [...participants, req.user._id], // include creator
      admin: req.user._id,
      isGroupChat: true,
    });

    console.log("Group created:", group);
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

    const regex = new RegExp(query.trim(), "i");

    const groups = await Chat.find({
      participants: req.user._id,
      groupName: { $regex: regex },
    }).populate("participants", "name email");

    return res.status(200).json({ groups });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};


// add user to group
export const addUserToGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Chat.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // only admin can add
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can add users" });
    }

    // avoid duplicate
    if (group.participants.some(p => p.toString() === userId)) {
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

    await Chat.findByIdAndDelete(groupId);

    res.json({ message: "Group deleted successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};