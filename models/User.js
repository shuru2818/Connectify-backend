import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  phone: {
    type: String,
    required:true,
    unique:true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  profilePic: {
  type: String,
  default: ""
  },
},{
  timestamps: true
});

export default mongoose.model('User', userSchema);