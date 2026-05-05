/**
 * @fileoverview Chatify v1 — Main server entry point.
 * Express + Socket.io + startup banner with env, flags, DB status.
 * @module server
 */

import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { getEnv, validateEnv } from './config/validateEnv.js';
import { connectDB, getDBStatus } from './config/db.js';
import { createRedisClient, checkRedisHealth } from './config/redis.js';
import logger from './utils/logger.js';
import { printFlags } from './utils/featureFlags.js';
import { requestLogger } from './middlewares/requestLogger.middleware.js';
import { sanitizeMiddleware } from './middlewares/sanitize.middleware.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.middleware.js';
import { socketAuthMiddleware } from './middlewares/socketAuth.middleware.js';
import { socketRateLimitMiddleware } from './middlewares/socketRateLimit.middleware.js';

// ── Validate env immediately ──
const env = validateEnv();

// ── ES Modules Fix ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Express app ──
const app = express();
const httpServer = createServer(app);

// ── Socket.io ──
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

// ── Global Middleware ──
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(cors({
  origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(requestLogger);
app.use(sanitizeMiddleware);

// ── HTTPS redirect in production ──
if (env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// ── Health check (no auth) ──
app.get('/api/health', async (req, res) => {
  const redisStatus = await checkRedisHealth();
  res.status(200).json({
    success: true,
    data: {
      ok: true,
      db: getDBStatus(),
      redis: redisStatus,
      uptime: Math.floor(process.uptime()),
      memMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      env: env.NODE_ENV,
      emailProvider: env.EMAIL_PROVIDER,
      version: '1.0.0',
    },
  });
});

// ── API Routes ──
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import messageRoutes from './routes/message.routes.js';
import friendRoutes from './routes/friend.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';
import systemRoutes from './routes/system.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/system', systemRoutes);

// ── Static Files (Production) ──
if (env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// ── 404 + Error handler ──
app.use(notFoundHandler);
app.use(errorHandler);

// ── Socket.io middleware ──
const chatNs = io.of('/chat');
chatNs.use(socketAuthMiddleware);
chatNs.use(socketRateLimitMiddleware);

// ── Socket handlers ──
import { initSocketHandlers } from './socket.js';
initSocketHandlers(chatNs);

import { initFeatureFlags } from './services/config.service.js';
import { startEmailWorker } from './services/emailQueue.service.js';

// ── Startup ──
async function start() {
  try {
    // Connect to databases
    await connectDB();
    createRedisClient();
    const redisStatus = await checkRedisHealth();

    // Initialize Dynamic Feature Flags
    await initFeatureFlags();

    // Start background workers
    startEmailWorker();

    // Start HTTP server
    httpServer.listen(env.PORT, () => {
      // Startup banner
      logger.info('');
      logger.info('══════════════════════════════════════════════');
      logger.info('  ⚡ CHATIFY v1 — Server Started');
      logger.info('══════════════════════════════════════════════');
      logger.info(`  Environment  : ${env.NODE_ENV}`);
      logger.info(`  Port         : ${env.PORT}`);
      logger.info(`  Client URL   : ${env.CLIENT_URL}`);
      logger.info(`  MongoDB      : ${getDBStatus()}`);
      logger.info(`  Redis        : ${redisStatus}`);
      logger.info(`  Email        : ${env.EMAIL_PROVIDER}`);
      logger.info(`  Log Level    : ${env.LOG_LEVEL}`);
      logger.info('══════════════════════════════════════════════');
      logger.info('');

      // Print feature flags
      printFlags(logger);

      logger.info('');
      logger.info(`  🚀 Ready at http://localhost:${env.PORT}`);
      logger.info('');
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

// ── Graceful shutdown ──
const shutdown = async (signal) => {
  logger.info(`\n${signal} received. Shutting down gracefully...`);
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => { process.exit(1); }, 10000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();

export { app, httpServer, io };
