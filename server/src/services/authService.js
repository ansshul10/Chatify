import { Resend } from 'resend';
import dotenv from "dotenv";

dotenv.config();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Default "From" address for Resend
const FROM_EMAIL = 'Chatify Security <onboarding@resend.dev>';

// ── Send Email Verification ───────────────────────────────────────────────────
export const sendVerificationEmail = async (email, name, token) => {
  const verifyURL = `${process.env.CLIENT_URL}/verify-email/${token}`;
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Verify your Chatify account",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;background:#080b14;color:#fff;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0ea5e9,#9333ea);padding:32px;text-align:center;">
            <h1 style="margin:0;font-size:28px;font-weight:800;">Chatify</h1>
            <p style="margin:8px 0 0;opacity:0.8;">Verify your email address</p>
          </div>
          <div style="padding:32px;">
            <p style="color:rgba(255,255,255,0.7);">Hi <strong style="color:#fff">${name}</strong>,</p>
            <p style="color:rgba(255,255,255,0.6);line-height:1.6;">
              Welcome to Chatify! Click the button below to verify your email and activate your account.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${verifyURL}" style="background:linear-gradient(135deg,#0ea5e9,#9333ea);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;font-size:16px;display:inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;">
              This link expires in <strong>24 hours</strong>. If you didn't create an account, ignore this email.
            </p>
          </div>
          <div style="background:rgba(255,255,255,0.03);padding:16px;text-align:center;">
            <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">© ${new Date().getFullYear()} Chatify. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Verification Email Error:", error);
  }
};

// ── Send Password Reset Email ─────────────────────────────────────────────────
export const sendPasswordResetEmail = async (email, name, token) => {
  const resetURL = `${process.env.CLIENT_URL}/reset-password/${token}`;
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Reset your Chatify password",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;background:#080b14;color:#fff;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0ea5e9,#9333ea);padding:32px;text-align:center;">
            <h1 style="margin:0;font-size:28px;font-weight:800;">Chatify</h1>
            <p style="margin:8px 0 0;opacity:0.8;">Password Reset Request</p>
          </div>
          <div style="padding:32px;">
            <p style="color:rgba(255,255,255,0.7);">Hi <strong style="color:#fff">${name}</strong>,</p>
            <p style="color:rgba(255,255,255,0.6);line-height:1.6;">
              We received a request to reset your password. Click the button below to create a new one.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${resetURL}" style="background:linear-gradient(135deg,#0ea5e9,#9333ea);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;font-size:16px;display:inline-block;">
                Reset My Password
              </a>
            </div>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:14px;margin-bottom:20px;">
              <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;">🔐 This link expires in 15 minutes.</p>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.03);padding:16px;text-align:center;">
            <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">© ${new Date().getFullYear()} Chatify. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Password Reset Email Error:", error);
  }
};

// ── Send New Device Alert ─────────────────────────────────────────────────────
export const sendNewDeviceAlert = async (email, name, deviceInfo) => {
  try {
    await resend.emails.send({
      from: 'Chatify Security <onboarding@resend.dev>',
      to: [email],
      subject: "⚠️ New device login detected — Chatify",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;background:#080b14;color:#fff;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:32px;text-align:center;">
            <h1 style="margin:0;font-size:28px;font-weight:800;">⚠️ Security Alert</h1>
          </div>
          <div style="padding:32px;">
            <p style="color:rgba(255,255,255,0.7);">Hi <strong style="color:#fff">${name}</strong>,</p>
            <p style="color:rgba(255,255,255,0.6);">A login was detected from a new device:</p>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin:20px 0;">
              <p style="margin:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">🌐 IP: <strong style="color:#fff">${deviceInfo.ip}</strong></p>
              <p style="margin:6px 0;color:rgba(255,255,255,0.5);font-size:13px;">💻 Device: <strong style="color:#fff">${deviceInfo.userAgent}</strong></p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Security Alert Email Error:", error);
  }
};

// ── Send Magic Link ───────────────────────────────────────────────────────────
export const sendMagicLinkEmail = async (email, name, token) => {
  const magicURL = `${process.env.CLIENT_URL}/magic-login/${token}`;
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "✨ Your Chatify Magic Login Link",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;background:#080b14;color:#fff;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0ea5e9,#9333ea);padding:32px;text-align:center;">
            <h1 style="margin:0;font-size:28px;font-weight:800;">✨ Magic Link</h1>
          </div>
          <div style="padding:32px;text-align:center;">
            <p style="color:rgba(255,255,255,0.7);">Hi <strong style="color:#fff">${name}</strong>,</p>
            <div style="margin:32px 0;">
              <a href="${magicURL}" style="background:linear-gradient(135deg,#0ea5e9,#9333ea);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;font-size:16px;display:inline-block;">
                Login to Chatify ✨
              </a>
            </div>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;">⏱️ Expires in 10 minutes.</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Magic Link Email Error:", error);
  }
};