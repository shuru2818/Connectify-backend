import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['invitation', 'accepted', 'rejected', 'message', 'group'],
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  invitation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invitation'
  },
  
  message: {
    text: String
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },

  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Notification', notificationSchema);