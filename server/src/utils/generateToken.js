import jwt from "jsonwebtoken";

// ── Set JWT in HttpOnly Cookie ────────────────────────────────────────────────
export const generateTokenAndSetCookie = (res, userId, rememberMe = false) => {
  const expiresIn = rememberMe ? "30d" : "7d";

  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn }
  );

  res.cookie("chatify_token", token, {
    httpOnly:  true,                                      // JS cannot access
    secure:    process.env.NODE_ENV === "production",     // HTTPS only in prod
    sameSite:  process.env.NODE_ENV === "production"
               ? "Strict"
               : "Lax",                                   // Lax for dev (cross-port)
    maxAge:    rememberMe
               ? 30 * 24 * 60 * 60 * 1000               // 30 days
               : 7  * 24 * 60 * 60 * 1000,               // 7 days
    path:      "/",
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

// ── Clear Cookie ──────────────────────────────────────────────────────────────
export const clearAuthCookie = (res) => {
  res.cookie("chatify_token", "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax",
    maxAge:   0,
    path:     "/",
  });
};
