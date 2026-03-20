import crypto from "crypto";
import User from "../models/User.js";
import {
  generateTokenAndSetCookie,
  generateTempToken,
  clearAuthCookie,
} from "../utils/generateToken.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNewDeviceAlert,
  sendMagicLinkEmail,
} from "../services/authService.js";

// ── Local Helpers ─────────────────────────────────────────────────────────────
const generateSecureToken = () => crypto.randomBytes(32).toString("hex");

/**
 * safeUser Helper:
 * Frontend ko sirf wahi data bhejta hai jo zaroori hai.
 * Role aur Subscription fields admin access aur pricing ke liye critical hain.
 */
const safeUser = (user) => ({
  _id:              user._id,
  name:              user.name,
  username:          user.username,
  email:             user.email,
  avatar:            user.avatar,
  role:              user.role,         // Admin Dashboard access ke liye
  subscription:      user.subscription, // Active Plan dikhane ke liye
  isEmailVerified:   user.isEmailVerified,
  twoFactorEnabled:  user.twoFactorEnabled,
  isOnline:          user.isOnline,
  createdAt:         user.createdAt,
});

const isNewDevice = (user, ip, userAgent) =>
  !user.knownDevices.some((d) => d.ip === ip && d.userAgent === userAgent);

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER — POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
export const register = async (req, res, errorNext) => {
  try {
    const { name, username, email, password } = req.body;

    console.log("📝 Register attempt:", { name, username, email });

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const existingEmail    = await User.findOne({ email:    email.toLowerCase() });
    const existingUsername = await User.findOne({ username: username.toLowerCase() });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username already taken.",
      });
    }

    const verifyToken   = generateSecureToken();
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    console.log("🔑 Creating user...");

    const user = await User.create({
      name:               name.trim(),
      username:           username.toLowerCase().trim(),
      email:              email.toLowerCase().trim(),
      password,
      emailVerifyToken:   crypto.createHash("sha256").update(verifyToken).digest("hex"),
      emailVerifyExpires: verifyExpires,
    });

    console.log("✅ User created:", user._id);

    // Using Resend API through authService
    sendVerificationEmail(user.email, user.name, verifyToken).catch((err) =>
      console.error("📧 Verification Email failed:", err.message)
    );

    return res.status(201).json({
      success: true,
      message: "Account created! Please verify your email.",
      user:     safeUser(user),
    });

  } catch (error) {
    console.error("❌ Register error:", error.message);
    return errorNext(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN — POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req, res, errorNext) => {
  try {
    const { email, password, rememberMe } = req.body;
    const ip        = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select("+password +loginAttempts +lockUntil +twoFactorSecret +knownDevices");

    if (!user || user.provider !== "local") {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Account Lockout Check
    if (user.checkIsLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await user.incrementLoginAttempts();
      const attemptsLeft = 5 - (user.loginAttempts + 1);
      return res.status(401).json({
        success: false,
        message: attemptsLeft > 0
          ? `Invalid credentials. ${attemptsLeft} attempt(s) remaining.`
          : "Account locked due to too many failed attempts.",
      });
    }

    await user.resetLoginAttempts();

    // 2FA Check
    if (user.twoFactorEnabled) {
      const tempToken = generateTempToken(user._id);
      return res.status(200).json({
        success:     true,
        requires2FA: true,
        tempToken,
        message:     "2FA code required.",
      });
    }

    // New Device Security Alert
    const newDevice = isNewDevice(user, ip, userAgent);
    if (newDevice) {
      user.knownDevices.push({ ip, userAgent, lastSeen: new Date() });
      if (user.knownDevices.length > 10) user.knownDevices.shift();
      await user.save();
      
      sendNewDeviceAlert(user.email, user.name, { ip, userAgent }).catch((err) =>
        console.error("Device alert failed:", err.message)
      );
    }

    generateTokenAndSetCookie(res, user._id, rememberMe);

    // Update Online Status
    user.isOnline = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user:     safeUser(user),
    });

  } catch (error) {
    console.error("❌ Login error:", error.message);
    return errorNext(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT — POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
export const logout = async (req, res, errorNext) => {
  try {
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, {
        isOnline: false,
        lastSeen: new Date(),
      });
    }

    clearAuthCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });

  } catch (error) {
    return errorNext(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ME — GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = async (req, res, errorNext) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isOnline: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user:     safeUser(user),
    });

  } catch (error) {
    return errorNext(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY EMAIL — GET /api/auth/verify-email/:token
// ─────────────────────────────────────────────────────────────────────────────
export const verifyEmail = async (req, res, errorNext) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailVerifyToken:   hashedToken,
      emailVerifyExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link.",
      });
    }

    user.isEmailVerified    = true;
    user.emailVerifyToken   = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    generateTokenAndSetCookie(res, user._id);

    return res.status(200).json({
      success: true,
      message: "Email verified! You are now logged in.",
      user:     safeUser(user),
    });

  } catch (error) {
    return errorNext(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD — POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = async (req, res, errorNext) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const resetToken  = generateSecureToken();
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken   = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    sendPasswordResetEmail(user.email, user.name, resetToken).catch((err) =>
      console.error("Reset email failed:", err.message)
    );

    return res.status(200).json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    });

  } catch (error) {
    return errorNext(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD — POST /api/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = async (req, res, errorNext) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken:   hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset link is invalid or has expired.",
      });
    }

    user.password             = password;
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    user.loginAttempts        = 0;
    user.lockUntil             = undefined;
    await user.save();

    generateTokenAndSetCookie(res, user._id);

    return res.status(200).json({
      success: true,
      message: "Password reset successful.",
      user:     safeUser(user),
    });

  } catch (error) {
    return errorNext(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CHECK USERNAME — GET /api/auth/check-username?username=xxx
// ─────────────────────────────────────────────────────────────────────────────
export const checkUsernameAvailability = async (req, res, errorNext) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
      });
    }

    const exists = await User.findOne({ username: username.toLowerCase() });

    return res.status(200).json({
      success:   true,
      available: !exists,
    });

  } catch (error) {
    return errorNext(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MAGIC LINK — POST /api/auth/magic-link
// ─────────────────────────────────────────────────────────────────────────────
export const sendMagicLink = async (req, res, errorNext) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that account exists, a magic link has been sent.",
      });
    }

    const magicToken  = generateSecureToken();
    const hashedToken = crypto.createHash("sha256").update(magicToken).digest("hex");

    user.resetPasswordToken   = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendMagicLinkEmail(user.email, user.name, magicToken).catch((err) =>
      console.error("Magic link email failed:", err.message)
    );

    return res.status(200).json({
      success: true,
      message: "Magic link sent! Check your inbox.",
    });

  } catch (error) {
    return errorNext(error);
  }
};