import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { 
  sendMessage, 
  getMessages, 
  editMessage,        // NEW: Edit function
  softDeleteMessage,  // NEW: Unsend (WhatsApp style)
  hardDeleteMessage,  // NEW: Permanent delete
  reactToMessage,
  markAsRead 
} from "../controllers/chatController.js";

const router = express.Router();

// Sabhi chat routes protected hone chahiye
router.use(protect);

// ─── MESSAGE OPERATIONS ──────────────────────────────────────────────────────

// 1. Send Message
router.post("/send", sendMessage); 

// 2. Fetch Chat History
router.get("/conversations/:receiverId", getMessages); 

// 3. Edit Message (PUT request for updates)
router.put("/edit", editMessage); 

// 4. Soft Delete / Unsend (Delete for Everyone - content replaces with "deleted")
router.delete("/unsend/:messageId", softDeleteMessage); 

// 5. Hard Delete (Permanently remove from database)
router.delete("/delete-permanent/:messageId", hardDeleteMessage); 

// ─── INTERACTION & STATUS ────────────────────────────────────────────────────

// 6. Emoji Reactions
router.post("/react", reactToMessage); 

// 7. Read Receipts (Mark messages as read/Blue Ticks)
router.post("/mark-as-read", markAsRead); 

export default router;