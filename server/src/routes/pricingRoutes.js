import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { 
  createPricingRequest, 
  getAdminPricingRequests, 
  handleAdminAction,
  toggleApprovalMode,
  verifyCoupon,
  getPricingConfig,
  updatePlanPrices,
  createCoupon,
  getAdminCoupons,
  deleteCoupon,
  getSystemSettings,     // Added for dynamic labels/version
  updateSystemSettings  // Added for dynamic labels/version
} from "../controllers/pricingController.js";

const router = express.Router();

// ─── USER / PUBLIC ROUTES ───────────────────────────────────────────────────

/**
 * @route   GET /api/pricing/config
 * @desc    Fetch Admin UPI ID and Dynamic Prices
 */
router.get("/config", protect, getPricingConfig);

/**
 * @route   GET /api/pricing/system-settings
 * @desc    Fetch Global Version, Infra Labels, and System Iterations
 * (Used by Landing, Security, and Changelog pages)
 */
router.get("/system-settings", getSystemSettings);

/**
 * @route   POST /api/pricing/verify-coupon
 * @desc    Verify coupon from DB and return discount percentage
 */
router.post("/verify-coupon", protect, verifyCoupon);

/**
 * @route   POST /api/pricing/request
 * @desc    Submit payment request with Decimal Logic and Note
 */
router.post("/request", protect, createPricingRequest);


// ─── ADMIN ROUTES ────────────────────────────────────────────────────────────

/**
 * @route   PATCH /api/pricing/admin/update-system-settings
 * @desc    Update Global Versioning and Page Labels
 */
router.patch("/admin/update-system-settings", protect, updateSystemSettings);

/**
 * @route   GET /api/pricing/admin/requests
 * @desc    Get all payment verification requests
 */
router.get("/admin/requests", protect, getAdminPricingRequests);

/**
 * @route   POST /api/pricing/admin/action/:id
 * @desc    Approve/Reject payment (Updates plan and sends Email)
 */
router.post("/admin/action/:id", protect, handleAdminAction);

/**
 * @route   PATCH /api/pricing/admin/update-prices
 * @desc    Update Plan Prices dynamically
 */
router.patch("/admin/update-prices", protect, updatePlanPrices);

/**
 * @route   POST /api/pricing/admin/create-coupon
 * @desc    Create a new discount coupon
 */
router.post("/admin/create-coupon", protect, createCoupon);

/**
 * @route   GET /api/pricing/admin/coupons
 * @desc    Get list of all coupons for Admin UI
 */
router.get("/admin/coupons", protect, getAdminCoupons);

/**
 * @route   DELETE /api/pricing/admin/coupon/:id
 * @desc    Remove a coupon from the database
 */
router.delete("/admin/coupon/:id", protect, deleteCoupon);

/**
 * @route   POST /api/pricing/admin/toggle-mode
 * @desc    Toggle Auto/Manual approval (Now synced with Settings model)
 */
router.post("/admin/toggle-mode", protect, toggleApprovalMode);

export default router;