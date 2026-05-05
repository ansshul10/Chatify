/**
 * @fileoverview Feature flag gate middleware — returns 404 if feature disabled.
 * @module middlewares/featureFlag.middleware
 */

import { isEnabled } from '../utils/featureFlags.js';
import { featureDisabled } from '../utils/apiResponse.js';

/**
 * Create middleware that gates a route behind a feature flag.
 * @param {string} flag - Feature flag name (e.g., 'FEATURE_ENCRYPTION')
 * @returns {Function} Express middleware
 */
export function requireFeature(flag) {
  return (req, res, next) => {
    if (!isEnabled(flag)) {
      return featureDisabled(res, flag);
    }
    next();
  };
}

export default requireFeature;
