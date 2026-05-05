/**
 * Feature flags reader — reads VITE_FEATURE_* from import.meta.env
 */

const flagCache = {};

export function isFeatureEnabled(flag) {
  const key = flag.startsWith('VITE_') ? flag : `VITE_${flag}`;
  if (flagCache[key] !== undefined) return flagCache[key];
  const val = import.meta.env[key];
  const enabled = val === 'true' || val === true;
  flagCache[key] = enabled;
  return enabled;
}

export function getAllFlags() {
  const flags = {};
  for (const [key, value] of Object.entries(import.meta.env)) {
    if (key.startsWith('VITE_FEATURE_')) {
      flags[key.replace('VITE_', '')] = value === 'true' || value === true;
    }
  }
  return flags;
}

export function getEnabledCount() {
  const all = getAllFlags();
  return Object.values(all).filter(Boolean).length;
}
