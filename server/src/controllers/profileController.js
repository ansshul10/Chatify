import crypto from "crypto";
import User from "../models/User.js";
import Profile from "../models/Profile.js";

/**
 * ─── HELPER: GET OR CREATE PROFILE ──────────────────────────────────────────
 * Ensures every user has a corresponding profile document and referral code.
 */
const getOrCreateProfile = async (userId) => {
  let profile = await Profile.findOne({ user: userId });
  if (!profile) {
    const referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    profile = await Profile.create({ user: userId, referralCode });
  }
  return profile;
};

/**
 * ─── HELPER: CALCULATE COMPLETION % ─────────────────────────────────────────
 * Dynamic calculation based on bio, avatar, socials, and security settings.
 */
const calcCompletion = (user, profile) => {
  const checks = [
    !!user.avatar,
    !!profile.bio,
    !!user.isEmailVerified,
    !!(profile.socialLinks?.github || profile.socialLinks?.linkedin || profile.socialLinks?.website),
    !!profile.coverColor,
    !!user.twoFactorEnabled,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PROFILE — GET /api/profile/me
// ─────────────────────────────────────────────────────────────────────────────
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const profile = await getOrCreateProfile(req.user._id);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          _id:              user._id,
          name:             user.name,
          username:         user.username,
          email:            user.email,
          avatar:           user.avatar,
          role:             user.role,
          isEmailVerified:  user.isEmailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          isOnline:         user.isOnline,
          lastSeen:         user.lastSeen,
          subscription:     user.subscription,
          provider:         user.provider,
          createdAt:        user.createdAt,
        },
        profile: {
          coverColor:    profile.coverColor,
          bio:           profile.bio,
          socialLinks:   profile.socialLinks,
          privacy:       profile.privacy,
          notifications: profile.notifications,
          referralCode:  profile.referralCode,
          referralCount: profile.referralCount,
          loginHistory:  profile.loginHistory.slice(-10).reverse(),
        },
        completion: calcCompletion(user, profile),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE BASIC INFO — PATCH /api/profile/basic
// ─────────────────────────────────────────────────────────────────────────────
export const updateBasicInfo = async (req, res, next) => {
  try {
    const { name, bio, avatar, coverColor } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (name.trim().length < 2 || name.trim().length > 50) {
        return res.status(400).json({ success: false, message: "Name must be 2–50 characters." });
      }
      updates.name = name.trim();
    }

    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    const profile = await getOrCreateProfile(req.user._id);

    if (bio !== undefined) profile.bio = bio.slice(0, 200);
    if (coverColor !== undefined) profile.coverColor = coverColor;
    
    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Node basic identity updated.",
      data: { 
        name: user.name, 
        avatar: user.avatar, 
        bio: profile.bio, 
        coverColor: profile.coverColor 
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE USERNAME — PATCH /api/profile/username
// ─────────────────────────────────────────────────────────────────────────────
export const updateUsername = async (req, res, next) => {
  try {
    const { username } = req.body;

    if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ success: false, message: "Invalid username format (3-20 chars, alphanumeric)." });
    }

    const taken = await User.findOne({
      username: username.toLowerCase(),
      _id: { $ne: req.user._id },
    });

    if (taken) {
      return res.status(409).json({ success: false, message: "Username already assigned to another node." });
    }

    await User.findByIdAndUpdate(req.user._id, { username: username.toLowerCase() });

    return res.status(200).json({ success: true, message: "Username configuration successful." });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE SOCIAL LINKS — PATCH /api/profile/social
// ─────────────────────────────────────────────────────────────────────────────
export const updateSocialLinks = async (req, res, next) => {
  try {
    const { github, linkedin, twitter, website } = req.body;
    const profile = await getOrCreateProfile(req.user._id);

    if (github   !== undefined) profile.socialLinks.github   = github;
    if (linkedin !== undefined) profile.socialLinks.linkedin = linkedin;
    if (twitter  !== undefined) profile.socialLinks.twitter  = twitter;
    if (website  !== undefined) profile.socialLinks.website  = website;

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Relay social links updated.",
      data: profile.socialLinks,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE PASSWORD — PATCH /api/profile/change-password
// ─────────────────────────────────────────────────────────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Handshake requires both passwords." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Cipher key must be at least 6 characters." });
    }

    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current authorization key is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ success: true, message: "Encryption key rotated successfully." });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PRIVACY SETTINGS — PATCH /api/profile/privacy
// ─────────────────────────────────────────────────────────────────────────────
export const updatePrivacy = async (req, res, next) => {
  try {
    const { profileVisibility, showEmail, showLastSeen } = req.body;
    const profile = await getOrCreateProfile(req.user._id);

    if (profileVisibility !== undefined) profile.privacy.profileVisibility = profileVisibility;
    if (showEmail         !== undefined) profile.privacy.showEmail         = showEmail;
    if (showLastSeen      !== undefined) profile.privacy.showLastSeen      = showLastSeen;

    await profile.save();

    // If ghost mode (hide last seen) is on, disable online status
    if (showLastSeen === false) {
      await User.findByIdAndUpdate(req.user._id, { isOnline: false });
    }

    return res.status(200).json({ success: true, message: "Privacy protocol updated.", data: profile.privacy });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE NOTIFICATIONS — PATCH /api/profile/notifications
// ─────────────────────────────────────────────────────────────────────────────
export const updateNotifications = async (req, res, next) => {
  try {
    const profile = await getOrCreateProfile(req.user._id);
    const allowed = ["emailOnNewDevice", "emailOnLogin", "emailOnNewMessage", "emailMarketing"];

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) profile.notifications[key] = req.body[key];
    });

    await profile.save();

    return res.status(200).json({ success: true, message: "Alert preferences synchronized.", data: profile.notifications });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET SESSIONS — GET /api/profile/sessions
// ─────────────────────────────────────────────────────────────────────────────
export const getSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+knownDevices");

    return res.status(200).json({
      success: true,
      data: {
        devices: user.knownDevices || [],
        count:   (user.knownDevices || []).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REVOKE ALL SESSIONS — DELETE /api/profile/sessions
// ─────────────────────────────────────────────────────────────────────────────
export const revokeAllSessions = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { knownDevices: [] });

    // Force purge auth cookie
    res.cookie("chatify_token", "", {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax",
      maxAge:   0,
      path:     "/",
    });

    return res.status(200).json({ success: true, message: "All node sessions revoked. Re-auth required." });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET LOGIN HISTORY — GET /api/profile/login-history
// ─────────────────────────────────────────────────────────────────────────────
export const getLoginHistory = async (req, res, next) => {
  try {
    const profile = await getOrCreateProfile(req.user._id);
    const history = profile.loginHistory.slice(-20).reverse();

    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE ONLINE STATUS — PATCH /api/profile/online-status
// ─────────────────────────────────────────────────────────────────────────────
export const toggleOnlineStatus = async (req, res, next) => {
  try {
    const { isOnline } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isOnline: !!isOnline },
      { new: true }
    );
    return res.status(200).json({ success: true, message: "Signal status updated.", isOnline: user.isOnline });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET REFERRAL INFO — GET /api/profile/referral
// ─────────────────────────────────────────────────────────────────────────────
export const getReferral = async (req, res, next) => {
  try {
    const profile = await getOrCreateProfile(req.user._id);
    const inviteLink = `${process.env.CLIENT_URL}/register?ref=${profile.referralCode}`;

    return res.status(200).json({
      success: true,
      data: {
        referralCode:  profile.referralCode,
        referralCount: profile.referralCount,
        inviteLink,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DEACTIVATE ACCOUNT — PATCH /api/profile/deactivate
// ─────────────────────────────────────────────────────────────────────────────
export const deactivateAccount = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false, isOnline: false });

    res.cookie("chatify_token", "", {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax",
      maxAge:   0,
      path:     "/",
    });

    return res.status(200).json({ success: true, message: "Node deactivated. Standing by." });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE ACCOUNT — DELETE /api/profile/delete
// ─────────────────────────────────────────────────────────────────────────────
export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (user.provider === "local") {
      if (!password) {
        return res.status(400).json({ success: false, message: "Authorization key required to purge node." });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Incorrect authorization key." });
      }
    }

    await Profile.findOneAndDelete({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);

    res.cookie("chatify_token", "", {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax",
      maxAge:   0,
      path:     "/",
    });

    return res.status(200).json({ success: true, message: "Node permanently purged from infrastructure." });
  } catch (error) {
    next(error);
  }
};