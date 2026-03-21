import jwt from "jsonwebtoken";

// ── Set JWT in HttpOnly Cookie ────────────────────────────────────────────────
export const generateTokenAndSetCookie = (res, userId, rememberMe = false) => {
  const expiresIn = rememberMe ? "30d" : "7d";

  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn }
  );

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("chatify_token", token, {
    httpOnly: true,                   // Prevents JavaScript access (security)
    secure: isProduction,             // Must be true in production (HTTPS only)
    sameSite: isProduction ? "none" : "lax",   // "none" required for cross-site
    maxAge: rememberMe
      ? 30 * 24 * 60 * 60 * 1000      // 30 days
      : 7 * 24 * 60 * 60 * 1000,      // 7 days
    path: "/",                        // Available across the entire site
    // NEVER set domain here when frontend & backend are on different TLDs
    // (vercel.app vs onrender.com) — it will break cookie setting
    // ✅ iOS Safari + Chrome + Firefox + Android ALL SUPPORT
    priority: isProduction ? "high" : "medium"  // Cookie priority boost
  });

  return token;
};

// ── Generate Short-Lived Temp Token (for 2FA flow) ───────────────────────────
export const generateTempToken = (userId) => {
  return jwt.sign(
    { userId, type: "2fa_pending" },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );
};

// ── Verify any JWT ────────────────────────────────────────────────────────────
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// ── Clear Cookie on Logout ───────────────────────────────────────────────────
export const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("chatify_token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 0,
    path: "/",
    priority: "high"
  });
};
