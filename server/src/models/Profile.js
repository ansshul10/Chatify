import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Feature 2: Cover banner
    coverColor: {
      type: String,
      default: "from-primary-600 to-purple-600",
    },

    // Feature 5: Bio
    bio: {
      type: String,
      maxlength: [200, "Bio cannot exceed 200 characters"],
      default: "",
    },

    // Feature 6: Social Links
    socialLinks: {
      github:   { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter:  { type: String, default: "" },
      website:  { type: String, default: "" },
    },

    // Feature 14: Login Activity Log (last 20)
    loginHistory: [
      {
        ip:        { type: String },
        userAgent: { type: String },
        loggedInAt:{ type: Date, default: Date.now },
        status:    { type: String, enum: ["success", "failed"], default: "success" },
      },
    ],

    // Feature 16: Privacy Settings
    privacy: {
      profileVisibility: {
        type: String,
        enum: ["public", "friends", "private"],
        default: "public",
      },
      showEmail:    { type: Boolean, default: false },
      showLastSeen: { type: Boolean, default: true },
    },

    // Feature 15: Notification Preferences
    notifications: {
      emailOnNewDevice:  { type: Boolean, default: true },
      emailOnLogin:      { type: Boolean, default: false },
      emailOnNewMessage: { type: Boolean, default: true },
      emailMarketing:    { type: Boolean, default: false },
    },

    // Feature 19: Referral
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referralCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;
