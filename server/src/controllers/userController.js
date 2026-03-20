import User from "../models/User.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const loggedInUserId = req.user._id;

    // Khud ko ($ne: loggedInUserId) AUR Admin ko ($ne: "admin") chhod kar baki active users fetch karein
    const users = await User.find({ 
      _id: { $ne: loggedInUserId },
      role: { $ne: "admin" }, // 🚀 FIXED: Admin ko hide kiya
      isActive: true 
    }).select("name username avatar isOnline lastSeen role");

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};