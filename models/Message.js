import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
{
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },

  content: {
    type: String,
    trim: true,
    default: ""
  },
  type: {
    type: String,
    enum: ["text", "image", "file"],
    default: "text",
  },
  fileUrl:{
    type: String,
    default: null
  },

  edited: {
    type: Boolean,
    default: false,
  },

  status: {
    type: String,
    enum: ["sent", "read", "delivered"],
    default: "sent",
  },

  readBy: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      readAt: { type: Date, default: Date.now },
    },
  ],  
},
{ timestamps: true }
);

export default mongoose.model("Message", messageSchema);