import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    // Global Versioning (e.g., "V1.0", "V2.5")
    currentVersion: { 
      type: String, 
      default: "V1.0" 
    },
    
    // Label for Security Page (e.g., "Fortress Infrastructure")
    infraLabel: { 
      type: String, 
      default: "Fortress Infrastructure" 
    },
    
    // Label for Architecture section (e.g., "Architecture V1.0 is live")
    architectureLabel: { 
      type: String, 
      default: "Architecture V1.0 is live" 
    },
    
    // Label for Changelog/System Iterations
    systemIterationLabel: { 
      type: String, 
      default: "System Iterations" 
    },
    
    // Toggle for Automatic Payment Approval
    autoApprove: { 
      type: Boolean, 
      default: false 
    },
    
    // Track who made the last change
    lastUpdatedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }
  },
  { 
    timestamps: true 
  }
);

// We only want ONE settings document in the entire collection
// This index isn't strictly necessary if you always use findOneAndUpdate({}),
// but it's good practice.
export default mongoose.model("Settings", settingsSchema);