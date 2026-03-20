import { Resend } from 'resend';
import dotenv from "dotenv";

dotenv.config();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * sendCommunityWelcomeEmail
 * Sends a premium dark-themed welcome email using Resend API (Port 443)
 * to bypass SMTP port restrictions on platforms like Render/Vercel.
 */
export const sendCommunityWelcomeEmail = async (email) => {
  try {
    const { data, error } = await resend.emails.send({
      // IMPORTANT: Resend free tier allows 'onboarding@resend.dev' until domain is verified
      from: 'Chatify Community <onboarding@resend.dev>',
      to: [email],
      subject: "Welcome to the Chatify community",
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:auto;background:#080b14;color:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.05);">
          <div style="background:linear-gradient(135deg,#0ea5e9,#9333ea);padding:32px;text-align:center;">
            <h1 style="margin:0;font-size:26px;font-weight:800;letter-spacing:-1px;">Welcome to Chatify</h1>
            <p style="margin:8px 0 0;font-size:14px;opacity:0.8;">You just joined the secure relay network.</p>
          </div>
          <div style="padding:32px;">
            <p style="color:rgba(255,255,255,0.7);margin:0 0 16px;font-size:15px;line-height:1.6;">
              Thanks for joining the Chatify community. We're excited to have you on board!
            </p>
            <p style="color:rgba(255,255,255,0.6);margin:0 0 16px;line-height:1.6;font-size:14px;">
              We'll occasionally share product updates, encryption tips, and early access invites to new Ghost Mode features with you.
            </p>
            <div style="margin-top:32px; padding-top:24px; border-top:1px solid rgba(255,255,255,0.05);">
              <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;">
                If this wasn't you, you can safely ignore this email. No further action is required.
              </p>
              <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:12px;text-transform:uppercase;letter-spacing:1px;">
                © ${new Date().getFullYear()} Chatify Labs. Secure Infrastructure.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Resend Community Email Error:", error);
      return { success: false, error };
    }

    console.log("📧 Community Welcome Sent:", data.id);
    return { success: true, data };

  } catch (err) {
    console.error("❌ Community Service Failure:", err.message);
    return { success: false, error: err.message };
  }
};