/**
 * @fileoverview Resend email provider using the Resend SDK.
 * @module services/resend.provider
 */

import { Resend } from 'resend';
import { getEnv } from '../config/validateEnv.js';
import { renderTemplate } from '../utils/templateRenderer.js';
import logger from '../utils/logger.js';

export default class ResendProvider {
  constructor() {
    const env = getEnv();
    this.providerName = 'resend';
    this.from = env.RESEND_FROM;
    this.client = new Resend(env.RESEND_API_KEY);
  }

  /**
   * Send an email using Resend.
   * @param {Object} options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.templateName - Template name
   * @param {Object} options.vars - Template variables
   * @returns {Promise<{id: string, provider: string, timestamp: Date}>}
   */
  async sendEmail({ to, subject, templateName, vars = {} }) {
    const env = getEnv();

    if (env.FEATURE_EMAIL_DEV_LOG && env.NODE_ENV === 'development') {
      const html = renderTemplate(templateName, vars);
      logger.info(`[EMAIL DEV] To: ${to} | Subject: ${subject} | Template: ${templateName}`);
      logger.debug(`[EMAIL DEV] HTML:\n${html.substring(0, 500)}...`);
      return { id: `dev_${Date.now()}`, provider: 'resend-dev', timestamp: new Date() };
    }

    const html = renderTemplate(templateName, vars);

    try {
      const { data, error } = await this.client.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });

      if (error) {
        throw new Error(`Resend error: ${error.message}`);
      }

      logger.info(`[EMAIL] Sent via Resend: ${to} | ${subject} | ID: ${data.id}`);
      return { id: data.id, provider: 'resend', timestamp: new Date() };
    } catch (err) {
      logger.error(`[EMAIL] Resend failed: ${err.message}`);
      throw err;
    }
  }
}
