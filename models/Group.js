import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      trim: true,
      required: true
    },
    groupImage: {
      type: String,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
    ],

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Group", groupSchema);