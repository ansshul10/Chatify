/**
 * @fileoverview Input sanitization middleware — mongo-sanitize + DOMPurify.
 * @module middlewares/sanitize.middleware
 */

import mongoSanitize from 'mongo-sanitize';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Sanitize all incoming request data (body, query, params).
 * Removes MongoDB operators and strips HTML/JS.
 */
export function sanitizeMiddleware(req, res, next) {
  if (req.body) {
    req.body = mongoSanitize(req.body);
    req.body = deepPurify(req.body);
  }
  if (req.query) req.query = mongoSanitize(req.query);
  if (req.params) req.params = mongoSanitize(req.params);
  next();
}

function deepPurify(obj) {
  if (typeof obj === 'string') return purify.sanitize(obj);
  if (Array.isArray(obj)) return obj.map(deepPurify);
  if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = deepPurify(value);
    }
    return cleaned;
  }
  return obj;
}

export default sanitizeMiddleware;
