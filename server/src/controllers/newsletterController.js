import User from "../models/User.js";
import Subscriber from "../models/Subscriber.js";
import Newsletter from "../models/Newsletter.js";
import { sendNewsletterEmail } from "../services/emailService.js";

/**
 * broadcastEmail
 * Sends newsletter to targeted segments using Resend API.
 * Bypasses SMTP restrictions on Render/Vercel.
 */
export const broadcastEmail = async (req, res) => {
    try {
        const { subject, content, target } = req.body;
        let recipients = [];

        // 🎯 Target Selection Logic
        if (target === "subscribers") {
            const subs = await Subscriber.find().select("email");
            recipients = subs.map(s => s.email);
        } else if (target === "pro_users") {
            const pros = await User.find({ "subscription.plan": { $ne: "free" } }).select("email");
            recipients = pros.map(u => u.email);
        } else {
            const all = await User.find().select("email");
            recipients = all.map(u => u.email);
        }

        if (recipients.length === 0) {
            return res.status(400).json({ success: false, message: "No recipients found for the selected target." });
        }

        // 🚀 Async Bulk Sending with Resend
        // Note: Resend API works over HTTPS (Port 443), so no port blocking issues.
        const emailPromises = recipients.map(email =>
            sendNewsletterEmail(email, subject, content).catch(err => {
                // Log individual failures but continue the loop
                console.error(`❌ Relay Failure for ${email}:`, err.message);
            })
        );

        // Wait for all transmissions to finish
        await Promise.all(emailPromises);

        // 📑 Save Broadcast History to MongoDB
        await Newsletter.create({
            subject,
            content,
            sentTo: target,
            recipientCount: recipients.length,
            sentBy: req.user._id
        });

        res.json({ 
            success: true, 
            message: `Node Broadcast Complete: Sent to ${recipients.length} recipients via Resend API.` 
        });

    } catch (error) {
        console.error("❌ Broadcast Controller Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * getNewsletterHistory
 * Fetches previous broadcast logs sorted by newest first.
 */
export const getNewsletterHistory = async (req, res) => {
    try {
        const history = await Newsletter.find()
            .populate("sentBy", "name email") // Optional: to see who sent it
            .sort({ createdAt: -1 });
            
        res.json({ success: true, history });
    } catch (err) { 
        console.error("❌ History Fetch Error:", err.message);
        res.status(500).json({ success: false, message: err.message }); 
    }
};