import Invitation from "../models/Invitation.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

export const sendInvitation = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverIds } = req.body;

    if (!receiverIds || !Array.isArray(receiverIds) || receiverIds.length === 0) {
      return res.status(400).json({ message: "Receiver IDs are required" });
    }

    const invitations = [];
    const results = [];

    for (const receiverId of receiverIds) {
      if (senderId.toString() === receiverId) {
        results.push({
          receiverId,
          status: "skipped",
          reason: "cannot send invitation to yourself",
        });
        continue;
      }

      const receiver = await User.findById(receiverId);
      if (!receiver) {
        results.push({
          receiverId,
          status: "skipped",
          reason: "receiver not found",
        });
        continue;
      }

      const existingInvitation = await Invitation.findOne({
        sender: senderId,
        receiver: receiverId,
      });

      if (existingInvitation) {
        if (existingInvitation.status === "pending") {
          results.push({
            receiverId,
            status: "skipped",
            reason: "invitation already pending",
            invitation: existingInvitation,
          });
          continue;
        }

        if (existingInvitation.status === "accepted") {
          results.push({
            receiverId,
            status: "skipped",
            reason: "invitation already accepted",
            invitation: existingInvitation,
          });
          continue;
        }

        if (existingInvitation.status === "rejected") {
          const rejectedAt = new Date(existingInvitation.rejectedAt);
          const now = Date.now();
          const hoursDiff = (now - rejectedAt) / (1000 * 60 * 60);

          if (hoursDiff < 24) {
            results.push({
              receiverId,
              status: "skipped",
              reason: "recently rejected",
              invitation: existingInvitation,
            });
            continue;
          }
        }
      }

      const invitation = await Invitation.create({
        sender: senderId,
        receiver: receiverId,
      });

      await Notification.create({
        recipient: receiverId,
        type: "invitation",
        sender: senderId,
        invitation: invitation._id,
        message: `${req.user.username} sent you an invitation`,
      });

      invitations.push(invitation);
      results.push({
        receiverId,
        status: "created",
        invitation,
      });
    }

    return res.status(201).json({
      message: "Invitations processed",
      invitations,
      results,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const invitation = await Invitation.findById(id);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    if (invitation.receiver.toString() !== currentUserId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to accept the invitation" });
    }

    if (invitation.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Invitation is no longer pending" });
    }

    invitation.status = "accepted";
    await invitation.save();

    await Notification.create({
      recipient: invitation.sender,
      type: "Invitation Accepted",
      sender: currentUserId,
      invitation: invitation._id,
      message: `${req.user.username} accepted your invitation`,
    });

    return res.status(200).json({ message: "Invitation Accepted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const rejectInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const invitation = await Invitation.findById(id);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    if (invitation.receiver.toString() !== currentUserId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to reject this invitation" });
    }

    if (invitation.status !== "pending") {
      return res
        .status(404)
        .json({ message: "Invitation not longer pending" });
    }

    invitation.status = "rejected";
    invitation.rejectedAt = new Date();
    await invitation.save();

    await Notification.create({
      recipient: invitation.sender,
      type: "Invitation Rejected",
      sender: currentUserId,
      invitation: invitation._id,
      message: `${req.user.username} rejected your invitation`,
    });

    return res.status(200).json({ message: "Invitation Rejected" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getMyInvitation = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const receivedPending = await Invitation.find({
      receiver: currentUserId,
      status: "pending",
    }).populate("sender", "-password");

    const receivedAccepted = await Invitation.find({
      receiver: currentUserId,
      status: "accepted",
    }).populate("sender", "-password");

    const sentPending = await Invitation.find({
      sender: currentUserId,
      status: "pending",
    }).populate("receiver", "-password");

    const sentAccepted = await Invitation.find({
      sender: currentUserId,
      status: "accepted",
    }).populate("receiver", "-password");

    return res.status(200).json({
      receivedPending,
      receivedAccepted,
      sentPending,
      sentAccepted,
      sent: [...sentPending, ...sentAccepted],
      received: [...receivedPending, ...receivedAccepted],
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};