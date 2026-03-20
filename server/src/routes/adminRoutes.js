import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import { broadcastEmail, getNewsletterHistory } from "../controllers/newsletterController.js";

const router = express.Router();

/**
 * ─── MIDDLEWARE: STRICT ADMIN CHECK ──────────────────────────────────────────
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ success: false, message: "Admin access required" });
  }
};

/**
 * ─── USER MANAGEMENT ─────────────────────────────────────────────────────────
 */

// 1. Get All Users (Filtered for Admin Dashboard & Chat Contacts)
// Frontend call: axiosInstance.get("/admin/users")
router.get("/users", protect, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    
    /**
     * LOGIC FIX: 
     * 1. $ne: loggedInUserId -> User ko khud ki profile na dikhe.
     * 2. role: { $ne: "admin" } -> System Administrator ko list se hide karein.
     */
    const users = await User.find({ 
      $and: [
        { _id: { $ne: loggedInUserId } },
        { role: { $ne: "admin" } } 
      ]
    })
    .select("-password") // Security: Password kabhi mat bhejo
    .sort({ isOnline: -1, name: 1 }); // Online users pehle, fir alphabetical order

    res.json({ 
      success: true, 
      count: users.length,
      users: users, // For Admin Dashboard
      data: users   // For Chat Sidebar compatibility
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Toggle User Status (Ban/Unban) - ADMIN ONLY
router.patch("/users/status/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive; 
    await user.save();
    
    res.json({ 
      success: true, 
      message: `User account has been ${user.isActive ? 'Activated' : 'Suspended'}` 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Change User Role (Admin/User) - ADMIN ONLY
router.patch("/users/role/:id", protect, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin", "moderator"].includes(role)) {
      return res.status(400).json({ message: "Invalid role type" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, message: `Role updated to ${role} for ${user.name}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * ─── ANALYTICS & NEWSLETTER ──────────────────────────────────────────────────
 */

// 4. Admin Analytics Dashboard
router.get("/analytics", protect, adminOnly, async (req, res) => {
  try {
    // Revenue logic (Adjust fields based on your subscription model)
    const revenueData = await User.aggregate([
      { $match: { "subscription.status": "active" } },
      { $group: { _id: null, total: { $sum: "$subscription.price" } } }
    ]);

    res.json({ 
      success: true, 
      totalRevenue: revenueData[0]?.total || 0,
      activeUsers: await User.countDocuments({ isActive: true }),
      totalUsers: await User.countDocuments(),
      recentGrowth: [4000, 7500, 5000, 9000, 12000, 15000, 18500] // Demo stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. Broadcast Newsletter
router.post("/newsletter/send", protect, adminOnly, broadcastEmail);

// 6. Fetch Newsletter Logs
router.get("/newsletter/history", protect, adminOnly, getNewsletterHistory);

export default router;