import User from "../models/User.js";

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user._id;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const regex = new RegExp(query.trim(), "i");

    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { username: { $regex: regex } },
        { email: { $regex: regex } },
        { phone: { $regex: regex } },
      ],
    }).select("-password");

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Search Users Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get User Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//alluser get
export const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const users = await User.find({
      _id: { $ne: currentUserId },
    }).select("-password");

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};