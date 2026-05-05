/**
 * Terms of Service Page
 */
import { FileText, Scale, AlertCircle } from 'lucide-react';
import './legal.css';

export default function Terms() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <header className="legal-header">
          <div className="legal-header__badge" style={{ display: 'inline-flex', padding: '6px 12px', background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)', fontSize: '12px', fontWeight: '700', marginBottom: '16px' }}>
            <Scale size={14} style={{ marginRight: '6px' }} /> Legal Terms
          </div>
          <h1 className="legal-header__title">Terms of Service</h1>
          <p className="legal-header__update">Last updated: April 30, 2026</p>
        </header>

        <div className="legal-content">
          <div className="legal-card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <h2 className="legal-section__title">Introduction</h2>
            <p>
              By using Chatify, you agree to these terms. Please read them carefully. Our service 
              is provided "as is" and we prioritize user security and platform integrity above all else.
            </p>
          </div>

          <section className="legal-section">
            <h2 className="legal-section__title">1. Eligibility</h2>
            <p>
              You must be at least 13 years old to use Chatify. By creating an account, you represent 
              and warrant that you meet this requirement and that your use of the service does not 
              violate any applicable law or regulation.
            </p>
          </section>

          <section className="legal-section">
            <h2 className="legal-section__title">2. User Conduct</h2>
            <p>
              You are responsible for all activity that occurs under your account. You agree not to:
            </p>
            <ul>
              <li>Use the service for any illegal or unauthorized purpose.</li>
              <li>Harass, threaten, or intimidate other users.</li>
              <li>Attempt to disrupt the service through malicious code or attacks.</li>
              <li>Impersonate others or provide false information.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2 className="legal-section__title">3. Account Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. 
              If you enable end-to-end encryption, you are solely responsible for your encryption 
              keys. We cannot recover lost keys or encrypted data.
            </p>
          </section>

          <section className="legal-section">
            <h2 className="legal-section__title">4. Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms or 
              engage in behavior that harms the community or platform.
            </p>
          </section>

          <div className="legal-contact">
            <h3 className="legal-contact__title">Legal Inquiries</h3>
            <p>For legal matters, reach out to <a href="mailto:legal@chatify.com" className="legal-contact__link">legal@chatify.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
