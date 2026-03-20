import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on("error",        (err)  => console.error(`❌ MongoDB Error: ${err}`));
    mongoose.connection.on("disconnected", ()     => console.warn("⚠️  MongoDB Disconnected"));
    mongoose.connection.on("reconnected",  ()     => console.log("🔄 MongoDB Reconnected"));

  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
