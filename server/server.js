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

// ✅ Allowed origins array (env + hardcoded fallback)
const allowedOrigins = [
  process.env.CLIENT_URL || "https://chatify007.vercel.app",
  process.env.FRONTEND_URL || "https://chatify007.vercel.app",
  "http://localhost:5173",
  "https://chatify007.vercel.app"
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
        console.log(`🔒 Socket CORS blocked: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  path: "/socket.io/",
  transports: ['websocket', 'polling'],  // Render stability
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket Authentication Middleware
io.use((socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie || "";
    const token = cookies
      .split("; ")
      .find((row) => row.startsWith("chatify_token="))
      ?.split("=")[1];

    if (!token) {
      console.log("🔐 Socket: No auth token");
      return next(new Error("Auth Error: No token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    console.log(`✅ Socket auth: User ${socket.userId}`);
    next();
  } catch (error) {
    console.log("❌ Socket JWT error:", error.message);
    next(new Error("Auth Error: Invalid token"));
  }
});

app.set("socketio", io);

io.on("connection", (socket) => {
  console.log(`🔌 Connected: User ${socket.userId}`);
  
  // Auto-join private room
  if (socket.userId) socket.join(socket.userId);

  // Typing indicators
  socket.on("typing", ({ receiverId }) => {
    socket.to(receiverId).emit("display_typing", { senderId: socket.userId });
  });

  socket.on("stop_typing", ({ receiverId }) => {
    socket.to(receiverId).emit("hide_typing", { senderId: socket.userId });
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Disconnected: User ${socket.userId}`);
  });
});
// ──────────────────────────────────────────────────────────────────────────────

// Global Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`🔒 CORS blocked: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
}));

// Request Logger
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} ${req.method} ${req.originalUrl} [${req.ip}]`);
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

// Health endpoint for Render/Platform.sh
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  console.error(`💥 ERROR ${status} ${req.method} ${req.originalUrl}:`, err.message);
  res.status(status).json({ 
    success: false, 
    message: err.message || "Internal Server Error" 
  });
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🚀 Server: http://localhost:${PORT}`);
      console.log(`📡 Socket.IO: Ready for ${allowedOrigins[0]}`);
      console.log(`🌐 CORS Allowed: ${allowedOrigins.join(', ')}`);
      console.log(`✅ All systems operational!\n`);
    });
  })
  .catch((err) => {
    console.error("💥 MongoDB Error:", err.message);
    process.exit(1);
  });

export default app;  // Vercel support ke liye
