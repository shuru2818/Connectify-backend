import Invitation from "../models/Invitation.js";
import Notification from "../models/Notification.js";
import { onlineUsers } from "../socket.js"; 

// SEND INVITATION
export const sendInvitation = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverIds } = req.body;

    if (!receiverIds || !Array.isArray(receiverIds)) {
      return res.status(400).json({ message: "Receiver IDs required" });
    }

    const io = req.app.get("io");  

    const invitations = [];

    for (const receiverId of receiverIds) {

      if (senderId.toString() === receiverId) continue;

      const existing = await Invitation.findOne({
        sender: senderId,
        receiver: receiverId,
      });

      if (existing && existing.status !== "rejected") continue;

      let invitation = await Invitation.create({
        sender: senderId,
        receiver: receiverId,
      });

      invitation = await invitation.populate([
        { path: "sender", select: "username email" },
        { path: "receiver", select: "username email" },
      ]);

      await Notification.create({
        recipient: receiverId,
        type: "invitation",
        sender: senderId,
        invitation: invitation._id,
        text: `${req.user.username} sent you an invitation`,
      });

      invitations.push(invitation);

    
      const receiverSocket = onlineUsers.get(receiverId.toString());

      if (receiverSocket) {
        io.to(receiverSocket.socketId).emit("newInvitation", invitation);
      }
    }

    res.status(201).json({ invitations });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// ACCEPT
export const acceptInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({ message: "Not found" });
    }

    invitation.status = "accepted";
    await invitation.save();

    const io = req.app.get("io");

    const senderSocket = onlineUsers.get(invitation.sender.toString());

    if (senderSocket) {
      io.to(senderSocket.socketId).emit("invitationAccepted", {
        invitationId: id,
      });
    }

    res.json({ message: "Accepted" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// REJECT
export const rejectInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({ message: "Not found" });
    }

    invitation.status = "rejected";
    invitation.rejectedAt = new Date();
    await invitation.save();

    const io = req.app.get("io");

    const senderSocket = onlineUsers.get(invitation.sender.toString());

    if (senderSocket) {
      io.to(senderSocket.socketId).emit("invitationRejected", {
        invitationId: id,
      });
    }

    res.json({ message: "Rejected" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// GET ALL
export const getMyInvitation = async (req, res) => {
  try {
    const userId = req.user._id;

    const received = await Invitation.find({
      receiver: userId,
    }).populate("sender", "-password");

    const sent = await Invitation.find({
      sender: userId,
    }).populate("receiver", "-password");

    res.json({ sent, received });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};