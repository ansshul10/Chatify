import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js"; // Ensure this path is correct

dotenv.config();

const seedAdmin = async () => {
  try {
    // 1. Connect to Database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connecting to MongoDB...");

    const adminEmail = "admin@chatify.com";
    
    // 2. Check if Admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("Admin already exists. Updating role to 'admin' just in case...");
      existingAdmin.role = "admin";
      await existingAdmin.save();
      console.log("✅ Admin role verified.");
      process.exit(0);
    }

    // 3. Create New Admin (Sending normal password)
    // Your User model's pre-save hook will handle the hashing automatically.
    const newAdmin = await User.create({
      name: "System Administrator",
      username: "chatify_admin",
      email: adminEmail,
      password: "Admin@123", // Normal password
      role: "admin",
      isEmailVerified: true,
      isActive: true,
      subscription: {
        plan: "enterprise",
        status: "active"
      }
    });

    console.log("✅ Admin user seeded successfully!");
    console.log("-----------------------------------");
    console.log(`Email: ${newAdmin.email}`);
    console.log(`Password: Admin@123`);
    console.log("-----------------------------------");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

seedAdmin();