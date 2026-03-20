import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { 
      type: String, 
      required: true, 
      unique: true, 
      uppercase: true,
      trim: true 
    },
    discountPercentage: { 
      type: Number, 
      required: true,
      min: 0,
      max: 100 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    expiryDate: { 
      type: Date 
    },
    usageLimit: {
      type: Number,
      default: null // null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", couponSchema);