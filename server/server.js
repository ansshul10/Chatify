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

// Allowed origins (production + development)
const allowedOrigins = [
  process.env.CLIENT_URL,                    // https://chatify007.vercel.app
  "http://localhost:5173",                   // local dev
  "https://chatify007.vercel.app",           // direct
  // agar preview branches hain to aur add kar sakte ho
];

// ─── SOCKET.IO SETUP ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  path: "/socket.io/",  // default, but explicit rakha
});

// Middleware: Socket Authentication (JWT from cookie)
io.use((socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie || "";
    const token = cookies
      .split("; ")
      .find((row) => row.startsWith("chatify_token="))
      ?.split("=")[1];

    if (!token) {
      console.log("Socket auth failed: No token");
      return next(new Error("Auth Error: No token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    console.log(`Socket authenticated for user: ${socket.userId}`);
    next();
  } catch (error) {
    console.error("Socket JWT error:", error.message);
    next(new Error("Auth Error: Invalid token"));
  }
});

app.set("socketio", io);

io.on("connection", (socket) => {
  console.log(`🔌 Live: User Connected (${socket.userId || "unauth"})`);
  
  // Join private room based on userId
  if (socket.userId) {
    socket.join(socket.userId);
  }

  // Typing events
  socket.on("typing", ({ receiverId }) => {
    if (receiverId) {
      socket.to(receiverId).emit("display_typing", { senderId: socket.userId });
    }
  });

  socket.on("stop_typing", ({ receiverId }) => {
    if (receiverId) {
      socket.to(receiverId).emit("hide_typing", { senderId: socket.userId });
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Live: User Disconnected (${socket.userId || "unauth"})`);
  });
});
// ──────────────────────────────────────────────────────────────────────────────

// Global Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Request Logger (helpful for Render logs)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Routes
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

// Health check for Render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// 404 & Error Handlers
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  console.error(`❌ Error ${status}: ${err.message} - Path: ${req.originalUrl}`);
  res.status(status).json({ success: false, message: err.message || "Server Error" });
});

// Database & Server Start
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(`✅ MongoDB Connected`);
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.IO active on ${process.env.CLIENT_URL || "localhost"}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  });
