import Message from "../models/Message.js";
import User from "../models/User.js";

/**
 * 1. SEND MESSAGE (With Double Tick / Delivered Logic)
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { 
      receiverId, 
      content, 
      isEncrypted, 
      encryptionHash, 
      type, 
      expiresAt, 
      scheduledFor 
    } = req.body;
    const senderId = req.user._id;

    // Check Receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: "Receiver not found" });
    }

    const io = req.app.get("socketio");
    
    // Check if receiver is online to set 'delivered' status
    const receiverRoom = io.sockets.adapter.rooms.get(receiverId.toString());
    const isReceiverOnline = receiverRoom && receiverRoom.size > 0;

    const messageData = {
      sender: senderId,
      receiver: receiverId,
      content,
      isEncrypted: isEncrypted || false,
      encryptionHash: encryptionHash || null,
      type: type || "text",
      status: isReceiverOnline ? "delivered" : "sent",
    };

    if (expiresAt) {
      messageData.expiresAt = new Date(expiresAt);
    }

    // Scheduled Messaging (Ultra Feature)
    if (scheduledFor && req.user.subscription?.plan === "enterprise") {
      messageData.scheduledFor = new Date(scheduledFor);
      messageData.isDelivered = false; 
    }

    const message = await Message.create(messageData);

    // Real-time Delivery
    if (!message.scheduledFor) {
      io.to(receiverId.toString()).emit("new_message", message);
      io.to(senderId.toString()).emit("message_sent", message);
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. EDIT MESSAGE
 * Allows the sender to update the content of a message.
 */
export const editMessage = async (req, res, next) => {
  try {
    const { messageId, newContent } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    // Unauthorized if not the sender
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Update message
    message.content = newContent;
    message.isEdited = true; // Make sure this is in your Schema
    await message.save();

    // Notify receiver via Socket
    const io = req.app.get("socketio");
    io.to(message.receiver.toString()).emit("message_updated", { messageId, newContent });
    io.to(message.sender.toString()).emit("message_updated", { messageId, newContent });

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. SOFT DELETE (Unsend / Delete for Everyone)
 * Keeps the record but hides the content.
 */
export const softDeleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Not found" });

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // WhatsApp style soft delete
    message.content = "This message was deleted";
    message.isDeletedForEveryone = true;
    message.isEncrypted = false;
    message.encryptionHash = null;
    await message.save();

    const io = req.app.get("socketio");
    io.to(message.receiver.toString()).emit("message_soft_deleted", { messageId });

    res.status(200).json({ success: true, message: "Message recalled" });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. HARD DELETE (Delete from Database)
 * Completely removes the message record.
 */
export const hardDeleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Not found" });

    // Allow deletion if the user is the sender
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await Message.findByIdAndDelete(messageId);

    const io = req.app.get("socketio");
    io.to(message.receiver.toString()).emit("message_deleted", { messageId });
    io.to(message.sender.toString()).emit("message_deleted", { messageId });

    res.status(200).json({ success: true, message: "Message permanently deleted" });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. GET MESSAGES (With Archive Logic)
 */
export const getMessages = async (req, res, next) => {
  try {
    const { receiverId } = req.params;
    const senderId = req.user._id;
    const userPlan = req.user.subscription?.plan || "free";

    let query = {
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
      isDelivered: { $ne: false }, 
    };

    if (userPlan === "pro") {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      query.createdAt = { $gte: oneYearAgo };
    } else if (userPlan === "free") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.createdAt = { $gte: thirtyDaysAgo };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .populate("sender", "name username avatar")
      .limit(500);

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. MESSAGE REACTIONS
 */
export const reactToMessage = async (req, res, next) => {
  try {
    const { messageId, emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Not found" });

    const existingIndex = message.reactions.findIndex(r => r.user.toString() === userId.toString());

    if (existingIndex > -1) {
      message.reactions[existingIndex].emoji = emoji;
    } else {
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();

    const io = req.app.get("socketio");
    const target = message.sender.toString() === userId.toString() ? message.receiver : message.sender;
    io.to(target.toString()).emit("reaction_update", { messageId, reactions: message.reactions });

    res.status(200).json({ success: true, data: message.reactions });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. MARK AS READ (Blue Tick Logic)
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { senderId } = req.body;
    const receiverId = req.user._id;

    await Message.updateMany(
      { sender: senderId, receiver: receiverId, status: { $ne: "read" } },
      { $set: { status: "read" } }
    );

    const io = req.app.get("socketio");
    io.to(senderId.toString()).emit("messages_read", { readBy: receiverId });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};