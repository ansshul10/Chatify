/**
 * @fileoverview Optional auth middleware — sets req.user if token present, continues if not.
 * @module middlewares/optional.auth.middleware
 */

import jwt from 'jsonwebtoken';
import { getEnv } from '../config/validateEnv.js';

export function optionalAuth(req, res, next) {
  const env = getEnv();
  const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      req.user = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch { req.user = null; }
  } else { req.user = null; }
  next();
}

export default optionalAuth;
