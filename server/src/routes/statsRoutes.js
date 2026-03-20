import express from "express";

const router = express.Router();

// In-memory base values (demo use)
let baseOnline = 9876;
let baseMessages = 123456;

router.get("/live", (req, res) => {
  const jitterOnline = Math.floor(Math.random() * 200);
  const jitterMessages = Math.floor(Math.random() * 500);

  return res.json({
    success: true,
    onlineUsers: baseOnline + jitterOnline,
    messagesToday: baseMessages + jitterMessages,
    uptime: "99.9%",
  });
});

export default router;
