import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
{
  groupName: {
    type: String,
    trim: true,
  },
  groupImage: {
    type: String,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  ],

  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  isGroupChat: {
    type: Boolean,
    default: false
  },

  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    }
  ],

  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  }

},
{
  timestamps: true
}
);

export default mongoose.model("Chat", chatSchema);