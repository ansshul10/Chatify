import express from "express";
import {
  getProfile,
  updateBasicInfo,
  updateUsername,
  updateSocialLinks,
  changePassword,
  updatePrivacy,
  updateNotifications,
  getSessions,
  revokeAllSessions,
  getLoginHistory,
  toggleOnlineStatus,
  getReferral,
  deactivateAccount,
  deleteAccount,
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes protected
router.use(protect);

router.get("/me",               getProfile);
router.patch("/basic",          updateBasicInfo);
router.patch("/username",       updateUsername);
router.patch("/social",         updateSocialLinks);
router.patch("/change-password",changePassword);
router.patch("/privacy",        updatePrivacy);
router.patch("/notifications",  updateNotifications);
router.get("/sessions",         getSessions);
router.delete("/sessions",      revokeAllSessions);
router.get("/login-history",    getLoginHistory);
router.patch("/online-status",  toggleOnlineStatus);
router.get("/referral",         getReferral);
router.patch("/deactivate",     deactivateAccount);
router.delete("/delete",        deleteAccount);

export default router;
