/**
 * Cookies Policy Page
 */
import { Cookie, Info, ShieldCheck } from 'lucide-react';
import './legal.css';

export default function Cookies() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <header className="legal-header">
          <div className="legal-header__badge" style={{ display: 'inline-flex', padding: '6px 12px', background: 'rgba(var(--warning-rgb), 0.1)', color: 'var(--warning)', fontSize: '12px', fontWeight: '700', marginBottom: '16px' }}>
            <Cookie size={14} style={{ marginRight: '6px' }} /> Cookie Info
          </div>
          <h1 className="legal-header__title">Cookies Policy</h1>
          <p className="legal-header__update">Last updated: April 30, 2026</p>
        </header>

        <div className="legal-content">
          <div className="legal-card">
            <h2 className="legal-section__title">What are cookies?</h2>
            <p>
              Cookies are small text files stored on your device that help us provide a better 
              experience. At Chatify, we use them sparingly and only for essential functionality.
            </p>
          </div>

          <section className="legal-section">
            <h2 className="legal-section__title">1. Essential Cookies</h2>
            <p>
              These are required for the service to function. We use them for:
            </p>
            <ul>
              <li><strong>Authentication:</strong> Keeping you logged in during your session.</li>
              <li><strong>Security:</strong> Protecting against CSRF and other malicious activities.</li>
              <li><strong>State Management:</strong> Remembering your UI preferences like theme and accent color.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2 className="legal-section__title">2. No Tracking Cookies</h2>
            <p>
              Chatify does <strong>not</strong> use any third-party tracking, advertising, or 
              analytics cookies. Your behavior on our platform is not monitored by us or any 
              third-party service providers.
            </p>
          </section>

          <section className="legal-section">
            <h2 className="legal-section__title">3. Managing Cookies</h2>
            <p>
              You can control or delete cookies through your browser settings. However, disabling 
              essential cookies will prevent you from logging in and using our chat features.
            </p>
          </section>

          <div className="legal-contact">
            <h3 className="legal-contact__title">More Information</h3>
            <p>Read our <a href="/privacy" className="legal-contact__link">Privacy Policy</a> to learn more about how we protect your data.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
