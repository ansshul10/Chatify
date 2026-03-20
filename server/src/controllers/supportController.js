import SupportTicket from "../models/SupportTicket.js";
import User from "../models/User.js";
import {
  sendTicketCreatedEmail,
  sendAdminReplyEmail,
  sendStatusUpdateEmail,
} from "../services/emailService.js";

// ── USER: Create Ticket ───────────────────────────────────────────────────────
export const createTicket = async (req, res, next) => {
  try {
    const { category, priority, subject, message, attachment } = req.body;

    if (!category || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: "Node identity required: Category, subject, and message must be provided." 
      });
    }

    const user = await User.findById(req.user._id);

    // Create ticket with user snapshot for historical data integrity
    const ticket = await SupportTicket.create({
      user: user._id,
      userSnapshot: {
        name: user.name,
        email: user.email,
        plan: user.subscription?.plan || "free",
      },
      category,
      priority: priority || "medium",
      subject: subject.trim(),
      message: message.trim(),
      attachment: attachment || null,
    });

    // Notify User via Resend Relay
    sendTicketCreatedEmail(user.email, user.name, ticket).catch((e) =>
      console.error("❌ Ticket creation email failed:", e.message)
    );

    return res.status(201).json({ 
      success: true, 
      message: "Support transmission logged successfully.", 
      ticket 
    });
  } catch (error) {
    next(error);
  }
};

// ── USER: Get My Tickets ──────────────────────────────────────────────────────
export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id })
      .select("-attachment -replies")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, tickets });
  } catch (error) {
    next(error);
  }
};

// ── USER: Get Single Ticket ────────────────────────────────────
export const getTicketById = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support node not found." });
    }

    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
};

// ── USER: Reply to Ticket ─────────────────────────────────────────────────────
export const userReply = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "Handshake requires a message body." });
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!ticket) return res.status(404).json({ success: false, message: "Ticket node not found." });
    
    if (ticket.status === "closed") {
      return res.status(400).json({ success: false, message: "Cannot inject signal into a closed terminal." });
    }

    ticket.replies.push({ sender: "user", message: message.trim() });
    ticket.status = "pending"; // Set to pending so admin knows user replied
    await ticket.save();

    return res.status(200).json({ success: true, message: "Response synchronized.", ticket });
  } catch (error) {
    next(error);
  }
};

// ── ADMIN: Get All Tickets ────────────────────────────────────────────────────
export const adminGetAllTickets = async (req, res, next) => {
  try {
    const { status, priority, plan, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status)   filter.status = status;
    if (priority) filter.priority = priority;
    if (plan)     filter["userSnapshot.plan"] = plan;

    const total = await SupportTicket.countDocuments(filter);
    const tickets = await SupportTicket.find(filter)
      .select("-attachment -replies")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Aggregate stats for the Admin Dashboard
    const stats = await SupportTicket.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statsMap = { open: 0, pending: 0, in_progress: 0, resolved: 0, closed: 0 };
    stats.forEach((s) => { statsMap[s._id] = s.count; });

    return res.status(200).json({ 
      success: true, 
      tickets, 
      total, 
      stats: statsMap,
      currentPage: Number(page)
    });
  } catch (error) {
    next(error);
  }
};

// ── ADMIN: Get Single Ticket ──────────────────────────────────────────────────
export const adminGetTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate("user", "name email username avatar subscription");
      
    if (!ticket) return res.status(404).json({ success: false, message: "Node link broken: Ticket not found." });

    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
};

// ── ADMIN: Reply ──────────────────────────────────────────────────────────────
export const adminReply = async (req, res, next) => {
  try {
    const { message, status } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "Response content is mandatory." });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Transmission target not found." });

    ticket.replies.push({ sender: "admin", message: message.trim() });
    if (status) ticket.status = status;
    await ticket.save();

    // Send Real-time Email via Resend Relay
    sendAdminReplyEmail(ticket.userSnapshot.email, ticket.userSnapshot.name, ticket, message.trim())
      .catch((e) => console.error("❌ Admin reply relay failed:", e.message));

    return res.status(200).json({ success: true, message: "Transmission successful.", ticket });
  } catch (error) {
    next(error);
  }
};

// ── ADMIN: Update Status ──────────────────────────────────────────────────────
export const adminUpdateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["open", "pending", "in_progress", "resolved", "closed"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid protocol status code." });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket node not found." });

    const prevStatus = ticket.status;
    ticket.status = status;
    await ticket.save();

    // Only send email if status has actually changed to avoid spam
    if (prevStatus !== status) {
      sendStatusUpdateEmail(ticket.userSnapshot.email, ticket.userSnapshot.name, ticket)
        .catch((e) => console.error("❌ Status update relay failed:", e.message));
    }

    return res.status(200).json({ success: true, message: `Node reconfigured to: ${status}`, ticket });
  } catch (error) {
    next(error);
  }
};

// ── ADMIN: Bulk Action ────────────────────────────────────────────────────────
export const adminBulkAction = async (req, res, next) => {
  try {
    const { ids, status } = req.body;
    if (!ids?.length || !status) {
      return res.status(400).json({ success: false, message: "Batch processing requires IDs and Status." });
    }

    const result = await SupportTicket.updateMany(
      { _id: { $in: ids } }, 
      { $set: { status } }
    );

    return res.status(200).json({ 
      success: true, 
      message: `Batch complete: ${result.modifiedCount} nodes reconfigured.` 
    });
  } catch (error) {
    next(error);
  }
};