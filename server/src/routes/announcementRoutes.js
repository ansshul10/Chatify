import express from "express";
import { 
  createAnnouncement, 
  getAnnouncements, 
  deleteAnnouncement 
} from "../controllers/announcementController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin check middleware (Inline)
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ success: false, message: "Admin access denied" });
  }
};

// Routes
router.get("/", protect, getAnnouncements);
router.post("/", protect, adminOnly, createAnnouncement);
router.delete("/:id", protect, adminOnly, deleteAnnouncement);

export default router;