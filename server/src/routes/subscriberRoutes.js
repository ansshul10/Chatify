import express from "express";
import Subscriber from "../models/Subscriber.js";
import { sendCommunityWelcomeEmail } from "../services/communityService.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email." });
    }

    const normalized = email.toLowerCase().trim();
    let sub = await Subscriber.findOne({ email: normalized });

    if (!sub) {
      sub = await Subscriber.create({ email: normalized });
      // async email (fire-and-forget)
      sendCommunityWelcomeEmail(normalized).catch(() => {});
    }

    return res.json({
      success: true,
      message: "You're in! We'll keep you posted.",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({
        success: true,
        message: "You are already in the community.",
      });
    }
    return next(err);
  }
});

export default router;
