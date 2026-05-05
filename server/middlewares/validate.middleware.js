/**
 * @fileoverview Zod schema validation middleware.
 * @module middlewares/validate.middleware
 */

import { validationError } from '../utils/apiResponse.js';

/**
 * Create validation middleware for a Zod schema.
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'|'params'} [source='body'] - Request property to validate
 * @returns {Function} Express middleware
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fieldErrors = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        fieldErrors[path] = issue.message;
      }
      return validationError(res, fieldErrors);
    }
    req[source] = result.data;
    next();
  };
}

export default validate;
