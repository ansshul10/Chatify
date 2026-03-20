import mongoose from "mongoose";
import crypto   from "crypto";

const replySchema = new mongoose.Schema({
  sender:    { type: String, enum: ["user", "admin"], required: true },
  message:   { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type:    String,
      unique:  true,
    },

    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },

    userSnapshot: {
      name:  String,
      email: String,
      plan:  { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
    },

    category: {
      type: String,
      enum: [
        "billing",
        "account",
        "bug",
        "feature_request",
        "security",
        "other",
      ],
      required: true,
    },

    priority: {
      type:    String,
      enum:    ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    subject: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 150,
    },

    message: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 5000,
    },

    attachment: {
      type:    String,
      default: null,
    },

    status: {
      type:    String,
      enum:    ["open", "pending", "in_progress", "resolved", "closed"],
      default: "open",
    },

    replies: [replySchema],

    lastEmailStatus: { type: String, default: null },
  },
  { timestamps: true }
);

// ✅ FIXED: next() remove kiya
supportTicketSchema.pre("save", function () {
  if (!this.ticketId) {
    const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
    this.ticketId = `TKT-${rand}`;
  }
});

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);
export default SupportTicket;
