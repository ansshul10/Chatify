/**
 * @fileoverview Morgan HTTP request logger with duration and color coding.
 * @module middlewares/requestLogger.middleware
 */

import morgan from 'morgan';
import logger from '../utils/logger.js';

const methodColors = {
  GET: '\x1b[32m',    // green
  POST: '\x1b[33m',   // yellow
  PATCH: '\x1b[36m',  // cyan
  PUT: '\x1b[34m',    // blue
  DELETE: '\x1b[31m', // red
};
const reset = '\x1b[0m';

const devFormat = (tokens, req, res) => {
  const method = tokens.method(req, res);
  const color = methodColors[method] || '';
  const status = tokens.status(req, res);
  const ms = tokens['response-time'](req, res);
  const url = tokens.url(req, res);
  return `${color}[${method}]${reset} ${url} → ${status} (${Math.round(ms)}ms)`;
};

const stream = { write: (message) => logger.http(message.trim()) };

export const requestLogger = process.env.NODE_ENV === 'production'
  ? morgan('combined', { stream })
  : morgan(devFormat, { stream });

export default requestLogger;
