import express from "express";

const router = express.Router();

// Simple health check
router.get("/", async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
  };

  try {
    res.status(200).json(healthcheck);
  } catch (e) {
    healthcheck.message = e.message;
    res.status(503).json(healthcheck);
  }
});

export default router;
