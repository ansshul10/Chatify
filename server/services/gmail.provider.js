/**
 * @fileoverview Gmail email provider using Nodemailer.
 * Uses App Password authentication.
 * @module services/gmail.provider
 */

import nodemailer from 'nodemailer';
import dns from 'dns';
import { getEnv } from '../config/validateEnv.js';
import { renderTemplate } from '../utils/templateRenderer.js';
import logger from '../utils/logger.js';

export default class GmailProvider {
  constructor() {
    const env = getEnv();
    this.providerName = 'gmail';
    this.from = env.gmail_user;

    this.transporter = nodemailer.createTransport({
      host: '142.251.10.108', // smtp.gmail.com IPv4
      port: 587,
      secure: false,
      auth: {
        user: env.gmail_user,
        pass: env.gmail_app_password,
      },
      tls: {
        // Must provide servername for certificate validation when using IP
        servername: 'smtp.gmail.com'
      }
    });
  }

  /**
   * Send an email using Gmail/Nodemailer.
   * @param {Object} options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.templateName - Template name (without .html)
   * @param {Object} options.vars - Template variables
   * @returns {Promise<{id: string, provider: string, timestamp: Date}>}
   */
  async sendEmail({ to, subject, templateName, vars = {} }) {
    const env = getEnv();

    // Dev mode: log to console instead of sending
    if (env.FEATURE_EMAIL_DEV_LOG && env.NODE_ENV === 'development') {
      const html = renderTemplate(templateName, vars);
      logger.info(`[EMAIL DEV] To: ${to} | Subject: ${subject} | Template: ${templateName}`);
      logger.debug(`[EMAIL DEV] HTML:\n${html.substring(0, 500)}...`);
      return { id: `dev_${Date.now()}`, provider: 'gmail-dev', timestamp: new Date() };
    }

    try {
      const html = renderTemplate(templateName, vars);
      const info = await this.transporter.sendMail({
        from: `Chatify <${this.from}>`,
        to,
        subject,
        html,
      });

      logger.info(`[EMAIL] Sent via Gmail: ${to} | ${subject} | ID: ${info.messageId}`);
      return { id: info.messageId, provider: 'gmail', timestamp: new Date() };
    } catch (err) {
      logger.error(`[EMAIL ERROR] Gmail failed: ${err.message}`);
      throw err;
    }
  }
}
