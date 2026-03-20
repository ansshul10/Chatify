import { Resend } from 'resend';
import dotenv from "dotenv";
import path from "path";

// Force load .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Initialize Resend with API Key
const resend = new Resend(process.env.RESEND_API_KEY);

// --- MODERN EMAIL STYLING (Forced Dark Theme) ---
const BODY_WRAP = `background-color: #03050a; padding: 40px 0; margin: 0; width: 100%; font-family: 'Segoe UI', Arial, sans-serif;`;
const CONTENT_INNER = `background-color: #080b14; color: #ffffff; padding: 40px 30px; max-width: 600px; margin: 0 auto; border-radius: 24px; border: 1px solid #1a1d26;`;
const ACCENT_COLOR = "#0ea5e9"; // Blue

const BADGE = {
  free:       { label: "FREE",  color: "#ffffff1a", text: "#94a3b8" },
  pro:        { label: "PLUS",  color: "#eab30820", text: "#eab308"   },
  enterprise: { label: "ULTRA", color: "#a855f720", text: "#a855f7"   },
};

const planBadge = (plan) => {
  const b = BADGE[plan] || BADGE.free;
  return `<span style="background:${b.color}; color:${b.text}; padding:4px 12px; border-radius:8px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:1px; border: 1px solid ${b.text}30;">${b.label}</span>`;
};

const STATUS_COLOR = {
  open: "#0ea5e9", pending: "#f59e0b", in_progress: "#8b5cf6", resolved: "#10b981", closed: "#64748b",
};

// --- SEND HELPER (Using Resend instead of Nodemailer) ---
const send = async (to, subject, htmlContent) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Chatify <onboarding@resend.dev>', // Replace with your verified domain later
      to: [to],
      subject: subject,
      html: `
        <html>
          <body style="margin:0; padding:0; background-color: #03050a;">
            <div style="${BODY_WRAP}">
              <div style="${CONTENT_INNER}">
                ${htmlContent}
                <div style="margin-top:40px; text-align:center; border-top: 1px solid #1a1d26; padding-top:25px;">
                  <p style="font-size:11px; color:#475569; text-transform:uppercase; letter-spacing:2px; margin:0;">
                    Sent via <b>Chatify.</b> Control Panel
                  </p>
                  <p style="font-size:10px; color:#1e293b; margin-top:10px;">
                    Managed Node Infrastructure
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Resend Error:", error);
      return { success: false, error };
    }

    console.log("📧 Email Sent Successfully:", data.id);
    return { success: true, data };
  } catch (err) {
    console.error("❌ Email Service Failure:", err.message);
    return { success: false, error: err.message };
  }
};

// --- 1. TICKET CREATED ---
export const sendTicketCreatedEmail = async (email, name, ticket) => {
  const html = `
    <div style="text-align:center; margin-bottom:35px;">
      <span style="font-size:32px; font-weight:900; letter-spacing:-1.5px; color:#fff;">Chatify<span style="color:${ACCENT_COLOR};">.</span></span>
    </div>
    <h2 style="font-size:22px; font-weight:800; margin-bottom:10px; color:#fff;">Transmission Received</h2>
    <p style="color:#94a3b8; font-size:14px; line-height:1.6; margin-bottom:30px;">
      Identity <b>${name}</b>, your support request has been successfully logged into our relay system.
    </p>
    <div style="background:#ffffff05; border:1px solid #ffffff10; border-radius:16px; padding:25px; margin-bottom:25px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-size:12px; color:#475569; padding-bottom:5px;">PROTOCOL ID</td><td align="right" style="font-family:monospace; font-weight:bold; color:${ACCENT_COLOR};">${ticket.ticketId}</td></tr>
        <tr><td style="font-size:12px; color:#475569; padding:10px 0;">TIER</td><td align="right" style="padding:10px 0;">${planBadge(ticket.userSnapshot?.plan)}</td></tr>
        <tr><td style="font-size:12px; color:#475569;">STATUS</td><td align="right" style="color:${ACCENT_COLOR}; font-weight:900; font-size:12px;">ACTIVE</td></tr>
      </table>
    </div>
    <div style="background:#0ea5e910; border-left:4px solid ${ACCENT_COLOR}; padding:15px; color:#e2e8f0; font-style:italic; font-size:13px; border-radius:0 12px 12px 0;">
      "${ticket.subject}"
    </div>
  `;
  return send(email, `[RELAY] Support Ticket: ${ticket.ticketId}`, html);
};

// --- 2. ADMIN REPLY ---
export const sendAdminReplyEmail = async (email, name, ticket, replyMessage) => {
  const html = `
    <div style="text-align:center; margin-bottom:35px;">
       <span style="font-size:32px; font-weight:900; letter-spacing:-1.5px; color:#fff;">Chatify<span style="color:${ACCENT_COLOR};">.</span></span>
    </div>
    <h2 style="font-size:22px; font-weight:800; margin-bottom:20px; color:#fff;">Admin Response Incoming</h2>
    <div style="background:${ACCENT_COLOR}15; border:1px solid ${ACCENT_COLOR}30; border-radius:16px; padding:25px; margin-bottom:25px;">
       <p style="font-size:11px; font-weight:900; color:${ACCENT_COLOR}; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px;">Transmission from Ops</p>
       <p style="font-size:15px; color:#f1f5f9; line-height:1.8; margin:0;">${replyMessage}</p>
    </div>
    <p style="text-align:center; font-size:12px; color:#475569;">Ref ID: ${ticket.ticketId}</p>
  `;
  return send(email, `[REPLY] Update on Ticket ${ticket.ticketId}`, html);
};

// --- 3. STATUS UPDATE ---
export const sendStatusUpdateEmail = async (email, name, ticket) => {
  const html = `
    <div style="text-align:center; margin-bottom:35px;">
       <span style="font-size:32px; font-weight:900; letter-spacing:-1.5px; color:#fff;">Chatify<span style="color:${ACCENT_COLOR};">.</span></span>
    </div>
    <div style="background:#ffffff05; border:1px solid #ffffff10; border-radius:24px; padding:35px; text-align:center;">
       <p style="font-size:11px; color:#475569; text-transform:uppercase; letter-spacing:2px; margin-bottom:15px;">New Node Status</p>
       <span style="font-size:26px; font-weight:900; text-transform:uppercase; color:${STATUS_COLOR[ticket.status] || "#fff"}; letter-spacing:-0.5px;">
         ${ticket.status.replace("_", " ")}
       </span>
       <p style="font-size:14px; color:#94a3b8; margin-top:20px; line-height:1.6;">
         The status of your communication channel <b>${ticket.ticketId}</b> has been reconfigured.
       </p>
    </div>
  `;
  return send(email, `[STATUS] Ticket Updated: ${ticket.status.toUpperCase()}`, html);
};

// --- 4. NEWSLETTER BROADCAST ---
export const sendNewsletterEmail = async (email, subject, content) => {
  const html = `
    <div style="text-align:center; margin-bottom:35px;">
       <span style="font-size:32px; font-weight:900; letter-spacing:-1.5px; color:#fff;">Chatify<span style="color:${ACCENT_COLOR};">.</span> <span style="font-weight:300; color:#475569;">Update</span></span>
    </div>
    <div style="background:#ffffff05; border:1px solid #ffffff10; border-radius:20px; padding:30px; line-height:1.8; color:#cbd5e1; font-size:15px;">
       ${content}
    </div>
    <div style="margin-top:35px; text-align:center;">
       <a href="${process.env.CLIENT_URL}" style="display:inline-block; background-color:#fff; color:#000; padding:12px 30px; border-radius:12px; font-weight:900; text-decoration:none; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Access Dashboard</a>
    </div>
  `;
  return send(email, subject, html);
};