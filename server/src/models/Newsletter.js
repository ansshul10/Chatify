import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  content: { type: String, required: true }, // HTML content support
  sentTo: { type: String, enum: ["all", "subscribers", "pro_users"], default: "all" },
  recipientCount: { type: Number, default: 0 },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Newsletter", newsletterSchema);