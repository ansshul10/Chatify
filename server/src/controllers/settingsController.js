import Settings from "../models/Settings.js";

// Get current system settings
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({}); // Default create agar nahi hai
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Update system settings (Admin Only)
export const updateSettings = async (req, res) => {
  try {
    const updateData = req.body;
    let settings = await Settings.findOneAndUpdate({}, updateData, { new: true, upsert: true });
    res.json({ success: true, settings, message: "System settings updated!" });
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};