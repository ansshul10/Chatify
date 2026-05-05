/**
 * @fileoverview Winston structured logger.
 * Dev: colorized console output at all levels.
 * Prod: JSON format, warn+error only, file transport.
 * @module utils/logger
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

/**
 * Custom log format for development — colorized, human-readable.
 */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss.SSS' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, service, ...meta }) => {
    const svc = service ? `[${service}] ` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    if (stack) {
      return `${timestamp} ${level} ${svc}${message}\n${stack}${metaStr}`;
    }
    return `${timestamp} ${level} ${svc}${message}${metaStr}`;
  })
);

/**
 * JSON format for production — structured, machine-parseable.
 */
const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  errors({ stack: true }),
  json()
);

/**
 * Determine log level from environment.
 * Production defaults to 'warn', development to 'debug'.
 */
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

/**
 * Determine if running in production.
 */
const isProd = process.env.NODE_ENV === 'production';

/**
 * Winston logger instance.
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
  level,
  defaultMeta: { service: 'chatify' },
  transports: [
    // Console transport — always active
    new winston.transports.Console({
      format: isProd ? prodFormat : devFormat,
    }),
  ],
});

// Add file transport in production
if (isProd) {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: prodFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: prodFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    })
  );
}

export default logger;
