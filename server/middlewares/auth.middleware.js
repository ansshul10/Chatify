/**
 * @fileoverview JWT authentication middleware — verifies access token from httpOnly cookie.
 * @module middlewares/auth.middleware
 */

import jwt from 'jsonwebtoken';
import { getEnv } from '../config/validateEnv.js';
import { unauthorized, forbidden } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * Require authentication — verifies JWT access token.
 * Attaches decoded user to `req.user`.
 */
export function requireAuth(req, res, next) {
  const env = getEnv();
  const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return unauthorized(res, 'No access token provided');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Access token expired');
    }
    logger.warn(`[AUTH] Invalid token: ${err.message}`);
    return unauthorized(res, 'Invalid access token');
  }
}

export default requireAuth;
