import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";

// Route Imports
import authRoutes from "./src/routes/authRoutes.js";
import healthRoutes from "./src/routes/healthRoutes.js";
import statsRoutes from "./src/routes/statsRoutes.js";
import subscriberRoutes from "./src/routes/subscriberRoutes.js";
import pricingRoutes from "./src/routes/pricingRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import supportRoutes from "./src/routes/supportRoutes.js";
import announcementRoutes from "./src/routes/announcementRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// ─── SOCKET.IO SETUP ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"]
  },
});

// Middleware: Socket Authentication (JWT check via Cookie)
io.use((socket, next) => {
  try {
    const token = socket.handshake.headers.cookie
      ?.split("; ")
      .find((row) => row.startsWith("chatify_token="))
      ?.split("=")[1];

    if (!token) return next(new Error("Auth Error: No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId; 
    next();
  } catch (error) {
    return next(new Error("Auth Error: Invalid token"));
  }
});

app.set("socketio", io);

io.on("connection", (socket) => {
  console.log(`🔌 Live: User Connected (${socket.userId})`);
  
  // Join Private Room
  socket.join(socket.userId);

  // ─── TYPING EVENTS ──────────────────────────────────
  // 1. Jab user type karna shuru kare
  socket.on("typing", ({ receiverId }) => {
    socket.to(receiverId).emit("display_typing", { senderId: socket.userId });
  });

  // 2. Jab user type karna band kare
  socket.on("stop_typing", ({ receiverId }) => {
    socket.to(receiverId).emit("hide_typing", { senderId: socket.userId });
  });
  // ─────────────────────────────────────────────────────

  socket.on("disconnect", () => {
    console.log(`🔌 Live: User Disconnected (${socket.userId})`);
  });
});
// ──────────────────────────────────────────────────────────────────────────────

// Global Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes Registration
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/subscribers", subscriberRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/admin", adminRoutes);

// 404 & Error Handlers
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  console.error(`❌ Error ${status}:`, err.message);
  res.status(status).json({ success: false, message: err.message || "Server Error" });
});

// Database & Server Initialization
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log(`✅ MongoDB Connected`);
    server.listen(PORT, () => {
      console.log(`🚀 Server: http://localhost:${PORT}`);
      console.log(`📡 Socket: Active & Secure`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  });