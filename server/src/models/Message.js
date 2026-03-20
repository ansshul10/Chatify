import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    // ─── CONTENT & ENCRYPTION ──────────────────────────────────────────
    content: { type: String, required: true }, 
    isEncrypted: { type: Boolean, default: false },
    encryptionHash: { type: String }, 
    
    // ─── MESSAGE TYPES & RICH MEDIA ────────────────────────────────────
    // Updated: added 'image' and 'file' for future proofing
    messageType: { 
      type: String, 
      enum: ["text", "emoji", "image", "file", "gif"], 
      default: "text" 
    },
    
    // ─── NEW: REPLYING & FORWARDING ────────────────────────────────────
    // Feature: Replying to a specific message
    replyTo: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Message", 
      default: null 
    },
    // Feature: Tagging forwarded messages
    isForwarded: { type: Boolean, default: false },

    // ─── NEW: SCREENSHOT PROTECTION ────────────────────────────────────
    // Feature: Log if a screenshot was detected for this message
    wasScreenshotTaken: { type: Boolean, default: false },

    // ─── RECALL & EDITING ──────────────────────────────────────────────
    isEdited: { type: Boolean, default: false },
    isDeletedForEveryone: { type: Boolean, default: false },
    
    // ─── STATUS & READ RECEIPTS ────────────────────────────────────────
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
    
    // ─── EMOJI REACTIONS ───────────────────────────────────────────────
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: String,
      },
    ],
    
    // ─── SCHEDULING & SELF-DESTRUCT ────────────────────────────────────
    expiresAt: { type: Date }, 
    scheduledFor: { type: Date },
    isDelivered: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// TTL Index for Self-destruct logic
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Message = mongoose.model("Message", messageSchema);
export default Message;