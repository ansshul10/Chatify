/**
 * @fileoverview Global error handler + 404 fallback.
 * Dev: full stack trace. Prod: generic message.
 * @module middlewares/errorHandler.middleware
 */

import logger from '../utils/logger.js';
import { getError } from '../utils/errorCodes.js';

/**
 * 404 handler — catches all unmatched routes.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'CHAT_ERR_003', message: `Route ${req.method} ${req.originalUrl} not found` },
  });
}

/**
 * Global async error handler for Express.
 * Catches all unhandled errors from async route handlers.
 */
export function errorHandler(err, req, res, _next) {
  const code = err.code || 'CHAT_ERR_500';
  const errorDef = getError(code);
  const status = err.status || errorDef.status || 500;
  const message = err.message || errorDef.message || 'Internal server error';

  // Log the error
  if (status >= 500) {
    logger.error(`[ERROR] ${status} ${code} — ${message}`, {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
      ip: req.ip,
    });
  } else {
    logger.warn(`[ERROR] ${status} ${code} — ${message}`);
  }

  const response = {
    success: false,
    error: { code, message },
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(status).json(response);
}

export default { notFoundHandler, errorHandler };
