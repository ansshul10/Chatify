/**
 * @fileoverview Template renderer — reads HTML files and replaces {{VAR}} tokens.
 * @module utils/templateRenderer
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, '..', 'templates', 'email');

/** Cache for loaded templates */
const templateCache = new Map();

/**
 * Load and render an email template with variable replacement.
 * @param {string} templateName - Template filename without extension (e.g., 'welcome')
 * @param {Record<string, string>} vars - Variables to replace
 * @returns {string} Rendered HTML
 */
export function renderTemplate(templateName, vars = {}) {
  let html = templateCache.get(templateName);

  if (!html) {
    const filePath = join(TEMPLATE_DIR, `${templateName}.html`);
    try {
      html = readFileSync(filePath, 'utf-8');
      templateCache.set(templateName, html);
    } catch (err) {
      logger.error(`[TEMPLATE] Template not found: ${templateName} at ${filePath}`);
      throw new Error(`Email template '${templateName}' not found`);
    }
  }

  // Replace all {{VAR}} tokens
  let rendered = html;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(regex, value || '');
  }

  // Warn about unreplaced tokens
  const unreplaced = rendered.match(/\{\{[A-Z_]+\}\}/g);
  if (unreplaced) {
    logger.warn(`[TEMPLATE] Unreplaced tokens in ${templateName}: ${unreplaced.join(', ')}`);
  }

  return rendered;
}

/**
 * Clear the template cache (useful for development hot-reload).
 */
export function clearTemplateCache() {
  templateCache.clear();
}

export default { renderTemplate, clearTemplateCache };
