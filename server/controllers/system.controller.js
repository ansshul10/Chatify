/**
 * @fileoverview System controller — public endpoints.
 */
import { getAllFlags } from '../utils/featureFlags.js';
import * as api from '../utils/apiResponse.js';

/**
 * GET /api/system/config — Fetch public configuration (flags, etc.)
 */
export async function getConfig(req, res) {
  const flags = getAllFlags();
  
  // Return only necessary info for client
  api.success(res, {
    flags,
    version: '1.0.0',
    maintenance: false,
  });
}

export default { getConfig };
