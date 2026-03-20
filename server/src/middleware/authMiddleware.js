import jwt       from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User      from "../models/User.js";

// ── Protect Route — Verify HttpOnly Cookie ────────────────────────────────────
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.chatify_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please log in.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please log in again.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated.",
      });
    }

    req.user = user;
    next();

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
    next(error);
  }
};

// ── Auth Rate Limiter (general routes) ───────────────────────────────────────
export const authRateLimiter = rateLimit({
  windowMs:               15 * 60 * 1000,
  max:                    10,
  standardHeaders:        true,
  legacyHeaders:          false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again in 15 minutes.",
  },
});

// ── Strict Rate Limiter (login / register) ────────────────────────────────────
export const strictRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: "Too many failed attempts. Please try again in 15 minutes.",
  },
});
