import express from "express";
import {
  createTicket,
  getMyTickets,
  getTicketById,
  userReply,
  adminGetAllTickets,
  adminGetTicket,
  adminReply,
  adminUpdateStatus,
  adminBulkAction,
} from "../controllers/supportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Middleware to verify admin role ──────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }
};

// ── Admin Routes (Must be BEFORE dynamic user routes like /my/:id) ────────────
router.get("/admin", protect, adminOnly, adminGetAllTickets);
router.get("/admin/:id", protect, adminOnly, adminGetTicket);
router.post("/admin/:id/reply", protect, adminOnly, adminReply);
router.patch("/admin/:id/status", protect, adminOnly, adminUpdateStatus);
router.post("/admin/bulk", protect, adminOnly, adminBulkAction);

// ── User Routes ───────────────────────────────────────────────────────────────
router.post("/", protect, createTicket);
router.get("/my", protect, getMyTickets);
router.get("/my/:id", protect, getTicketById);
router.post("/my/:id/reply", protect, userReply);

export default router;