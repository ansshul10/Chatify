import PricingRequest from "../models/PricingRequest.js";
import User from "../models/User.js";
import Coupon from "../models/Coupon.js";
import Settings from "../models/Settings.js";
import { Resend } from 'resend';
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Chatify Billing <onboarding@resend.dev>';

// --- Fallback Pricing State ---
let dynamicPrices = {
  pro: { monthly: 199, yearly: 1490 },
  enterprise: { monthly: 499, yearly: 3990 }
};

/**
 * ─── HELPER: EMAIL TEMPLATES (Dark Theme Chatify Style) ──────────────────────
 */
const getEmailTemplate = (user, planId, status, paymentNote, reason = "") => {
  const brandColor = planId === "enterprise" ? "#a855f7" : "#0ea5e9";
  const planName = planId === "enterprise" ? "ULTRA" : "PLUS";

  const baseStyles = `
    font-family: 'Segoe UI', Arial, sans-serif;
    background-color: #03050a;
    color: #ffffff;
    padding: 40px 20px;
  `;

  const containerStyles = `
    max-width: 600px;
    margin: 0 auto;
    background-color: #080b14;
    border-radius: 24px;
    border: 1px solid #1a1d26;
    padding: 40px 30px;
  `;

  if (status === "approved") {
    return {
      subject: `Plan Activated: Welcome to Chatify ${planName}! 🚀`,
      html: `
        <div style="${baseStyles}">
          <div style="${containerStyles}">
            <h2 style="color: ${brandColor}; font-size: 24px; font-weight: 800; margin-bottom: 20px;">Transmission Verified!</h2>
            <p style="color: #94a3b8; font-size: 15px;">Hello <b>${user.name}</b>,</p>
            <p style="color: #f1f5f9; font-size: 15px;">Your high-frequency subscription for the <b style="color: ${brandColor}">${planName}</b> node is now active.</p>
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 16px; margin: 30px 0; border: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 5px 0; font-size: 12px; color: #475569;">REF NOTE: <b style="color: #fff;">${paymentNote}</b></p>
              <p style="margin: 5px 0; font-size: 12px; color: #475569;">STATUS: <b style="color: #10b981;">ACTIVE / SYNCED</b></p>
            </div>
            <p style="color: #475569; font-size: 13px;">Ghost Mode and Advanced Encryption features are now unlocked for your account.</p>
          </div>
        </div>`
    };
  } else {
    return {
      subject: `Action Required: Payment Verification Failed ⚠️`,
      html: `
        <div style="${baseStyles}">
          <div style="${containerStyles}">
            <h2 style="color: #ef4444; font-size: 24px; font-weight: 800; margin-bottom: 20px;">Verification Error</h2>
            <p style="color: #94a3b8; font-size: 15px;">Hello <b>${user.name}</b>,</p>
            <p style="color: #f1f5f9; font-size: 15px;">Our relay system could not verify your payment for <b>${planName}</b>.</p>
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 20px; border-radius: 16px; margin: 30px 0;">
              <p style="color: #f87171; font-weight: bold; margin: 0; font-size: 14px;">Reason: ${reason}</p>
            </div>
            <p style="color: #475569; font-size: 12px;">Payment Reference: ${paymentNote}</p>
            <p style="color: #94a3b8; font-size: 13px;">Please initiate a new request or contact HQ support if you have any queries.</p>
          </div>
        </div>`
    };
  }
};

/**
 * ─── ADMIN: SYSTEM SETTINGS & LABELS ────────────────────────────────────────
 */
export const updateSystemSettings = async (req, res) => {
  try {
    const { currentVersion, infraLabel, architectureLabel, systemIterationLabel, autoApprove } = req.body;
    const settings = await Settings.findOneAndUpdate(
      {},
      { currentVersion, infraLabel, architectureLabel, systemIterationLabel, autoApprove, lastUpdatedBy: req.user._id },
      { new: true, upsert: true }
    );
    global.autoApprove = settings.autoApprove;
    res.json({ success: true, settings, message: "Global System Configuration Updated!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

export const getSystemSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Fetch failed" });
  }
};

/**
 * ─── ADMIN: COUPON MANAGEMENT ──────────────────────────────────────────────
 */
export const createCoupon = async (req, res) => {
  try {
    const { code, discountPercentage, expiryDate } = req.body;
    const coupon = await Coupon.create({ code: code.toUpperCase(), discountPercentage, expiryDate });
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: "Coupon code already exists or invalid data." });
  }
};

export const getAdminCoupons = async (req, res) => {
    try {
      const coupons = await Coupon.find().sort({ createdAt: -1 });
      res.json({ success: true, coupons });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch coupons." });
    }
};

export const deleteCoupon = async (req, res) => {
    try {
      await Coupon.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: "Coupon deleted successfully." });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete coupon." });
    }
};

/**
 * ─── ADMIN: PRICE MANAGEMENT ──────────────────────────────────────────────
 */
export const updatePlanPrices = async (req, res) => {
  try {
    const { planId, monthly, yearly } = req.body;
    if (dynamicPrices[planId]) {
      dynamicPrices[planId] = { monthly: Number(monthly), yearly: Number(yearly) };
      return res.json({ success: true, message: `${planId} prices updated!` });
    }
    res.status(400).json({ success: false, message: "Invalid plan ID" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

/**
 * ─── USER/PUBLIC: GET CONFIG ────────────────────────────────────────────────
 */
export const getPricingConfig = async (req, res) => {
  res.json({ 
    success: true, 
    prices: dynamicPrices,
    upiId: process.env.ADMIN_UPI_ID 
  });
};

/**
 * ─── USER: VERIFY COUPON ───────────────────────────────────────────────────
 */
export const verifyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Invalid or expired coupon." });
    res.json({ success: true, discount: coupon.discountPercentage });
  } catch (error) {
    res.status(500).json({ success: false, message: "Verification error." });
  }
};

/**
 * ─── USER: CREATE REQUEST ──────────────────────────────────────────────────
 */
export const createPricingRequest = async (req, res, next) => {
  try {
    const { planId, billingCycle, utr, pricePaid, screenshot, couponCode } = req.body;
    const paymentNote = `REF-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    if (utr && utr !== "N/A") {
      const duplicate = await PricingRequest.findOne({ utr });
      if (duplicate) return res.status(400).json({ success: false, message: "This UTR is already used." });
    }

    await PricingRequest.create({
      userId: req.user._id,
      planId,
      billingCycle,
      pricePaid, 
      utr: utr || "N/A",
      paymentNote,
      screenshot: screenshot || null,
      couponUsed: couponCode || null,
      status: "pending",
    });

    res.status(201).json({ 
      success: true, 
      paymentNote,
      message: screenshot ? "Handshake initiated! Fast-track active." : "Manual verification (12-24h) started."
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ─── ADMIN: APPROVE / REJECT (Using Resend API) ───────────────────────────
 */
export const handleAdminAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const request = await PricingRequest.findById(id).populate("userId");
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    request.status = status;
    if (reason) request.rejectReason = reason;
    await request.save();

    if (status === "approved") {
      await User.findByIdAndUpdate(request.userId._id, {
        "subscription.plan": request.planId,
        "subscription.status": "active",
        "subscription.startDate": new Date(),
      });
    }

    // 📧 Generate Email Content
    const emailData = getEmailTemplate(request.userId, request.planId, status, request.paymentNote, reason);

    // 🚀 Send via Resend API
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [request.userId.email],
      subject: emailData.subject,
      html: emailData.html,
    });

    res.json({ success: true, message: `Node Status '${status}' updated & user notified.` });
  } catch (error) {
    console.error("❌ Admin Action Email Failure:", error.message);
    res.json({ success: true, message: `Status updated locally, but email relay failed.` });
  }
};

/**
 * ─── ADMIN: GET ALL REQUESTS ───────────────────────────────────────────────
 */
export const getAdminPricingRequests = async (req, res, next) => {
  try {
    const requests = await PricingRequest.find()
      .populate("userId", "name email username")
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

/**
 * ─── ADMIN: TOGGLE MODE ────────────────────────────────────────────────────
 */
export const toggleApprovalMode = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    const newMode = settings ? !settings.autoApprove : true;
    await Settings.findOneAndUpdate({}, { autoApprove: newMode }, { upsert: true });
    global.autoApprove = newMode;
    res.json({ success: true, autoApprove: newMode });
  } catch (error) {
    res.status(500).json({ success: false, message: "Toggle failed" });
  }
};