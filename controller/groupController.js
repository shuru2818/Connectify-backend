// GROUP CONTROLLER COMPLETE UPDATED

import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

// CREATE GROUP
export const createGroup = async (req, res) => {
  try {
    const { groupName, participants, groupImage } = req.body;

    if (!groupName || !participants) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    if (participants.length < 1) {
      return res.status(400).json({
        message: "At least 1 participant required",
      });
    }

    const allUsers = [
      ...participants,
      req.user._id.toString(),
    ];

    const uniqueUsers = [...new Set(allUsers)];

    const group = await Chat.create({
      groupName,
      groupImage,
      participants: uniqueUsers,
      admin: req.user._id,
      isGroupChat: true,
    });

    const fullGroup = await Chat.findById(group._id)
      .populate(
        "participants",
        "username email profilePic avatar"
      )
      .populate(
        "admin",
        "username email profilePic avatar"
      );

    res.status(201).json(fullGroup);

  } catch (err) {
    console.log("Create group error:", err);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// GET MY GROUPS
export const getMyGroups = async (req, res) => {
  try {

    const groups = await Chat.find({
      participants: req.user._id,
      isGroupChat: true,
    })
      .populate(
        "participants",
        "username email profilePic avatar"
      )
      .populate(
        "admin",
        "username email profilePic avatar"
      );

    res.json(groups);

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// SEARCH GROUPS
export const searchGroups = async (req, res) => {
  try {

    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const groups = await Chat.find({
      participants: req.user._id,
      groupName: {
        $regex: query,
        $options: "i",
      },
      isGroupChat: true,
    })
      .populate(
        "participants",
        "username email profilePic avatar"
      )
      .populate(
        "admin",
        "username email profilePic avatar"
      );

    return res.json(groups);

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ADD USER TO GROUP
export const addUserToGroup = async (req, res) => {
  try {

    const { groupId, userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const group = await Chat.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // ONLY ADMIN CAN ADD
    if (
      group.admin.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Only admin can add users",
      });
    }

    // AVOID DUPLICATE
    if (
      group.participants.some(
        (p) => p.toString() === userId.toString()
      )
    ) {
      return res.json({
        message: "User already in group",
      });
    }

    group.participants.push(userId);

    await group.save();

    const updatedGroup = await Chat.findById(groupId)
      .populate(
        "participants",
        "username email profilePic avatar"
      )
      .populate(
        "admin",
        "username email profilePic avatar"
      );

    res.json(updatedGroup);

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// REMOVE USER FROM GROUP
export const removeUserFromGroup = async (req, res) => {
  try {

    const { groupId, userId } = req.body;

    const group = await Chat.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // ONLY ADMIN
    if (
      group.admin.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Only admin can remove users",
      });
    }

    group.participants =
      group.participants.filter(
        (p) =>
          p.toString() !== userId.toString()
      );

    await group.save();

    const updated = await Chat.findById(groupId)
      .populate(
        "participants",
        "username email profilePic avatar"
      )
      .populate(
        "admin",
        "username email profilePic avatar"
      );

    res.json(updated);

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// DELETE GROUP
export const deleteGroup = async (req, res) => {
  try {

    const { groupId } = req.params;

    const group = await Chat.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // ONLY ADMIN CAN DELETE
    if (
      group.admin.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Only admin can delete group",
      });
    }

    await Message.deleteMany({
      chat: groupId,
    });

    await Chat.findByIdAndDelete(groupId);

    res.json({
      message: "Group deleted successfully",
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

//update image (group)
export const updateGroupImage = async (
  req,
  res
) => {
  try {

    const { groupId } = req.params;

    const group = await Chat.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // ONLY ADMIN
    if (
      group.admin.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Only admin can update group image",
      });
    }

    group.groupImage = req.file.path;

    await group.save();

    const updatedGroup =
      await Chat.findById(groupId)
        .populate(
          "participants",
          "username email profilePic avatar"
        )
        .populate(
          "admin",
          "username email profilePic avatar"
        );

    res.json(updatedGroup);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};