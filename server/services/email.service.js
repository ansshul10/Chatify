/**
 * @fileoverview Email service factory — reads EMAIL_PROVIDER and returns the matching provider.
 * Both providers implement identical interface:
 *   sendEmail({ to, subject, templateName, vars }) → { id, provider, timestamp }
 * @module services/email.service
 */

import { getEnv } from '../config/validateEnv.js';
import GmailProvider from './gmail.provider.js';
import ResendProvider from './resend.provider.js';
import logger from '../utils/logger.js';

const providers = {
  gmail: GmailProvider,
  resend: ResendProvider,
};

/**
 * Create the configured email provider instance.
 * @returns {GmailProvider|ResendProvider}
 */
function createEmailService() {
  const env = getEnv();
  const ProviderClass = providers[env.EMAIL_PROVIDER];

  if (!ProviderClass) {
    throw new Error(`Unknown EMAIL_PROVIDER: "${env.EMAIL_PROVIDER}". Must be "gmail" or "resend".`);
  }

  const provider = new ProviderClass();
  logger.info(`[EMAIL] Provider initialized: ${env.EMAIL_PROVIDER}`);
  return provider;
}

let _instance = null;

/**
 * Get the singleton email service instance.
 * @returns {GmailProvider|ResendProvider}
 */
export function getEmailService() {
  if (!_instance) {
    _instance = createEmailService();
  }
  return _instance;
}

export default getEmailService;
