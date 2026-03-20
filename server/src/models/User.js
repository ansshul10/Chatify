import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username cannot exceed 20 characters"],
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },

    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    avatar: {
      type: String,
      default: "",
    },

    // --- ADMIN & ROLE LOGIC ---
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // --- SUBSCRIPTION LOGIC ---
    subscription: {
      plan: { 
        type: String, 
        enum: ["free", "pro", "enterprise"], 
        default: "free" 
      },
      status: { 
        type: String, 
        enum: ["none", "pending", "active"], 
        default: "none" 
      },
      startDate: { type: Date },
      expiresAt: { type: Date },
    },

    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },

    providerId: { type: String },

    isEmailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },

    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },

    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },

    // FIX 1: select:false add kiya — controller mein explicitly select karo
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },

    isActive: { type: Boolean, default: true },

    // FIX 2: Array format — select:false add kiya
    knownDevices: {
      type: Array,
      default: [],
      select: false,
    },

    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date },
  },
  { timestamps: true }
);

// FIX 3: virtual "isLocked" REMOVE — checkIsLocked() method use karo
// virtual mongoose internals se conflict karta tha

// FIX 4: async pre-save mein next() REMOVE — just return karo
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Method: Compare password ──────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// FIX 5: isLocked virtual ki jagah method — "checkIsLocked"
userSchema.methods.checkIsLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// ── Method: Increment login attempts ─────────────────────────────────────────
userSchema.methods.incrementLoginAttempts = async function () {
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME_MS = 15 * 60 * 1000;

  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // FIX 6: this.isLocked → this.checkIsLocked()
  if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.checkIsLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_TIME_MS) };
  }

  return this.updateOne(updates);
};

// ── Method: Reset login attempts ─────────────────────────────────────────────
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

const User = mongoose.model("User", userSchema);
export default User;