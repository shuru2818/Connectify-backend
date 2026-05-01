import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
{
  isGroupChat : {
    type: Boolean,
    default: false
  },

  groupName: {
  type: String,
  trim: true,
  required: function () {
    return this.isGroupChat;
  }
},

  groupImage: {
    type: String,
  },

  participants: {
  type: [mongoose.Schema.Types.ObjectId],
  ref: "User",
  required: true
},

  admin: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: function() {
    return this.isGroupChat === true;
  }
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

export default mongoose.model("Chat", chatSchema);