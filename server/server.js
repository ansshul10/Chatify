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

// ✅ iOS Safari + All Browsers Compatible Origins
const allowedOrigins = [
  process.env.CLIENT_URL || "https://chatify007.vercel.app",
  process.env.FRONTEND_URL || "https://chatify007.vercel.app",
  "https://chatify007.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"  // Extra dev safety
];

// ─── SOCKET.IO SETUP (iOS Optimized) ──────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`🔒 Socket Blocked: ${origin}`);
        callback(new Error("CORS Denied"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  path: "/socket.io/",
  transports: ['websocket', 'polling'],  // iOS fallback
  pingTimeout: 30000,    // iOS aggressive
  pingInterval: 10000,
  maxHttpBufferSize: 1e6,
  cookie: false  // Manual cookie handling
});

// 🔐 Socket Auth Middleware (Cookie + JWT)
io.use((socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie || "";
    const token = cookies
      .split("; ")
      .find(row => row.startsWith("chatify_token="))
      ?.split("=")[1];

    if (!token) {
      console.log("🔐 Socket: No token");
      return next(new Error("Auth: No token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    console.log(`✅ Socket: User ${socket.userId} connected`);
    next();
  } catch (error) {
    console.log("❌ Socket Auth:", error.message);
    next(new Error("Auth: Invalid token"));
  }
});

app.set("socketio", io);

io.on("connection", (socket) => {
  console.log(`🔌 User ${socket.userId} connected (${socket.id.slice(0,8)})`);
  
  if (socket.userId) socket.join(socket.userId);

  // Real-time typing
  socket.on("typing", ({ receiverId }) => socket.to(receiverId).emit("display_typing", { senderId: socket.userId }));
  socket.on("stop_typing", ({ receiverId }) => socket.to(receiverId).emit("hide_typing", { senderId: socket.userId }));

  socket.on("disconnect", () => {
    console.log(`🔌 User ${socket.userId} disconnected`);
  });
});

// ─── GLOBAL MIDDLEWARES (iOS Cookie Optimized) ────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// 🚀 iOS Safari + Chrome + Firefox Compatible CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`🔒 CORS Blocked: ${origin}`);
      callback(new Error("CORS Denied"));
    }
  },
  credentials: true,  // 🔑 Cookies for iOS
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// 📊 Request Logger
app.use((req, res, next) => {
  console.log(`📡 [${req.ip}] ${req.method} ${req.originalUrl}`);
  next();
});

// ─── ROUTES ──────────────────────────────────────────────────────────────────
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

// 🩺 Health Check (Render/Platform.sh)
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    cors: allowedOrigins[0]
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route Not Found" });
});

// 💥 Global Error Handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  console.error(`💥 ${status} ${req.method} ${req.originalUrl}:`, err.message);
  res.status(status).json({ 
    success: false, 
    message: err.message || "Server Error" 
  });
});

// 🚀 LAUNCH SEQUENCE
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    server.listen(PORT, "0.0.0.0", () => {
      console.log("\n🚀 Server LIVE:", `http://localhost:${PORT}`);
      console.log("📡 Socket.IO:", allowedOrigins[0]);
      console.log("🌐 iOS CORS:", allowedOrigins.join(", "));
      console.log("✅ iOS/Android/Desktop READY!\n");
    });
  })
  .catch((err) => {
    console.error("💥 MongoDB FAILED:", err.message);
    process.exit(1);
  });

export default app;
