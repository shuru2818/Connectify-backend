import Notification from "../models/Notification.js";

//get notification
export const getMyNotifications =  async (req, res)=>{
  try{

    const currentUserId = req.user._id;
    const notification = await Notification.find({recipient :currentUserId})
      .sort({createdAt : -1})
      .populate("sender", "-password")
      .populate("invitation")
      .populate("chat");

      return res.json(notification);

  }catch(err){
    return res.status(500).json({ message: err });
  }
}

//markas read notification

export const markAsRead = async(req, res)=>{
  try{

    const {id} = req.params;
    const currentUserId = req.user._id;

    const notification  = await Notification.findById(id);

    if(!notification){
      return res.status(404).json({message:"Notifications not found"});
    }

    if(notification.recipient.toString() !== currentUserId.toString()){
      return res.status(403).json({message:"Not Authorized"});
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({message:"Notifications Marked as read"});

  }catch(err){
    return res.status(500).json({ message: err });
  }
}

//markallas read

export const markAllAsRead =  async(req, res)=>{

  try{
    const currentUserId = req.user._id;

    const notification = await Notification.updateMany(
      {recipient : currentUserId , isRead : false},
      {$set: { isRead: true }}
    )
    return res.status(200).json({message: "All Notifications marked as read"});

  }catch(err){
    return res.status(500).json({ message: err });
  }
}

//delete the notifications

export const deleteNotifications =  async(req, res)=>{
  try{

    const {id} =  req.params;
    const currentUserId = req.user._id;

    const notification =  await Notification.findById(id);
    if(!notification){
      return res.status(404).json({message:"Notifications not found"});
    }

    if(notification.recipient.toString() !== currentUserId.toString()){
      return res.status(403).json({message:"Not Authorized"});
    }
    
    await Notification.findByIdAndDelete(id);

    return res.status(200).json({message : "Notifications deleted"})
  }catch(err){
    return res.status(500).json({ message: err });
  }
}

