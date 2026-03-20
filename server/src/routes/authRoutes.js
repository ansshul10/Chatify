import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  checkUsernameAvailability,
  sendMagicLink,
} from "../controllers/authController.js";
import {
  protect,
  authRateLimiter,
  strictRateLimiter,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post("/register",             authRateLimiter,   register);
router.post("/login",                strictRateLimiter, login);
router.post("/forgot-password",      authRateLimiter,   forgotPassword);
router.post("/reset-password/:token",                   resetPassword);
router.post("/magic-link",           authRateLimiter,   sendMagicLink);
router.get("/verify-email/:token",                      verifyEmail);
router.get("/check-username",                           checkUsernameAvailability);

// ── Protected Routes ──────────────────────────────────────────────────────────
router.post("/logout", protect, logout);
router.get("/me",      protect, getMe);

export default router;
