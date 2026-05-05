/**
 * @fileoverview Standardized API response helpers.
 * All API responses follow a consistent shape:
 * Success: { success: true, data, meta? }
 * Error:   { success: false, error: { code, message, details? } }
 * @module utils/apiResponse
 */

/**
 * Send a success response.
 * @param {import('express').Response} res - Express response object
 * @param {*} data - Response payload
 * @param {number} [statusCode=200] - HTTP status code
 * @param {object} [meta] - Optional metadata (pagination, etc.)
 */
export function success(res, data, statusCode = 200, meta = null) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

/**
 * Send a created response (201).
 * @param {import('express').Response} res
 * @param {*} data
 */
export function created(res, data) {
  return success(res, data, 201);
}

/**
 * Send a no-content response (204).
 * @param {import('express').Response} res
 */
export function noContent(res) {
  return res.status(204).end();
}

/**
 * Send a paginated response with cursor metadata.
 * @param {import('express').Response} res
 * @param {Array} items - Array of results
 * @param {object} pagination - { cursor, limit, hasMore, total? }
 */
export function paginated(res, items, pagination) {
  return res.status(200).json({
    success: true,
    data: items,
    meta: {
      pagination: {
        cursor: pagination.cursor || null,
        nextCursor: pagination.nextCursor || null,
        limit: pagination.limit,
        hasMore: pagination.hasMore,
        total: pagination.total ?? undefined,
      },
    },
  });
}

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} code - Error code (e.g., "CHAT_ERR_001")
 * @param {string} message - Human-readable error message
 * @param {number} [statusCode=400] - HTTP status code
 * @param {object} [details] - Additional error details (field errors, etc.)
 */
export function error(res, code, message, statusCode = 400, details = null) {
  const body = {
    success: false,
    error: { code, message },
  };
  if (details) body.error.details = details;
  return res.status(statusCode).json(body);
}

/**
 * Send a 401 Unauthorized response.
 * @param {import('express').Response} res
 * @param {string} [message='Authentication required']
 */
export function unauthorized(res, message = 'Authentication required') {
  return error(res, 'CHAT_ERR_001', message, 401);
}

/**
 * Send a 403 Forbidden response.
 * @param {import('express').Response} res
 * @param {string} [message='Access denied']
 */
export function forbidden(res, message = 'Access denied') {
  return error(res, 'CHAT_ERR_002', message, 403);
}

/**
 * Send a 404 Not Found response.
 * @param {import('express').Response} res
 * @param {string} [message='Resource not found']
 */
export function notFound(res, message = 'Resource not found') {
  return error(res, 'CHAT_ERR_003', message, 404);
}

/**
 * Send a 409 Conflict response.
 * @param {import('express').Response} res
 * @param {string} [message='Resource already exists']
 */
export function conflict(res, message = 'Resource already exists') {
  return error(res, 'CHAT_ERR_004', message, 409);
}

/**
 * Send a 422 Validation Error response.
 * @param {import('express').Response} res
 * @param {object} fieldErrors - Field-level validation errors
 */
export function validationError(res, fieldErrors) {
  return error(res, 'CHAT_ERR_005', 'Validation failed', 422, fieldErrors);
}

/**
 * Send a 429 Rate Limit response.
 * @param {import('express').Response} res
 * @param {string} [message='Too many requests. Please try again later.']
 */
export function rateLimited(res, message = 'Too many requests. Please try again later.') {
  return error(res, 'CHAT_ERR_006', message, 429);
}

/**
 * Send a 500 Internal Server Error response.
 * @param {import('express').Response} res
 * @param {string} [message='Internal server error']
 */
export function serverError(res, message = 'Internal server error') {
  return error(res, 'CHAT_ERR_500', message, 500);
}

/**
 * Send a 503 Service Unavailable response.
 * @param {import('express').Response} res
 * @param {string} [message='Service temporarily unavailable']
 */
export function serviceUnavailable(res, message = 'Service temporarily unavailable') {
  return error(res, 'CHAT_ERR_503', message, 503);
}

/**
 * Send a feature disabled response (403 or 404).
 * @param {import('express').Response} res
 * @param {string} feature - Feature flag name
 */
export function featureDisabled(res, feature) {
  const friendlyName = feature.replace('FEATURE_', '').replace(/_/g, ' ').toLowerCase();
  return error(
    res, 
    'CHAT_ERR_FEATURE_DISABLED', 
    `This service (${friendlyName}) is currently under maintenance or disabled by the administrator. Please try again later.`, 
    403
  );
}

export default {
  success,
  created,
  noContent,
  paginated,
  error,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  rateLimited,
  serverError,
  serviceUnavailable,
  featureDisabled,
};
