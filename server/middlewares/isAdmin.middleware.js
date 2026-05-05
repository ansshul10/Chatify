/**
 * @fileoverview Admin role check middleware.
 * @module middlewares/isAdmin.middleware
 */

import { forbidden } from '../utils/apiResponse.js';

export function isAdmin(req, res, next) {
  if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
    return forbidden(res, 'Admin access required');
  }
  next();
}

export default isAdmin;
