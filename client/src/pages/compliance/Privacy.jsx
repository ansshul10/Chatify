/**
 * Privacy Page
 */
import { Shield, Lock, Eye, FileText } from 'lucide-react';
import './legal.css';

export default function Privacy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <header className="legal-header">
          <div className="legal-header__badge" style={{ display: 'inline-flex', padding: '6px 12px', background: 'rgba(var(--success-rgb), 0.1)', color: 'var(--success)', fontSize: '12px', fontWeight: '700', marginBottom: '16px' }}>
            <Shield size={14} style={{ marginRight: '6px' }} /> Privacy Verified
          </div>
          <h1 className="legal-header__title">Privacy Policy</h1>
          <p className="legal-header__update">Last updated: April 30, 2026</p>
        </header>

        <div className="legal-content">
          <div className="legal-card">
            <h2 className="legal-section__title">Our Commitment</h2>
            <p>
              At Chatify, we believe that privacy is a fundamental human right. Our platform is built 
              from the ground up to ensure that your private conversations stay private. This policy 
              explains how we handle the minimal amount of data we collect.
            </p>
          </div>

          <section className="legal-section">
            <h2 className="legal-section__title">1. Data Collection</h2>
            <p>
              Unlike other platforms, we do not collect your personal information for advertising 
              or tracking purposes. The only data we store is what is necessary for the app to function:
            </p>
            <ul>
              <li><strong>Account Information:</strong> Your username and display name.</li>
              <li><strong>Authentication:</strong> Securely hashed passwords and email (if provided).</li>
              <li><strong>Preferences:</strong> Your theme and accent color choices.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2 className="legal-section__title">2. Messaging & Encryption</h2>
            <p>
              All messages sent through Chatify can be optionally end-to-end encrypted. When encryption 
              is enabled:
            </p>
            <ul>
              <li>We cannot read your messages.</li>
              <li>The encryption keys never leave your device.</li>
              <li>Messages are only stored in their encrypted form on our servers.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2 className="legal-section__title">3. Data Sharing</h2>
            <p>
              We <strong>never</strong> sell, rent, or trade your data with third parties. We do not 
              participate in any data-sharing ecosystems for advertising or profiling.
            </p>
          </section>

          <section className="legal-section">
            <h2 className="legal-section__title">4. Your Rights</h2>
            <p>
              You have the right to access, export, or delete your data at any time. If you delete 
              your account, all your associated data, including messages and profile information, 
              is permanently removed from our active databases.
            </p>
          </section>

          <div className="legal-contact">
            <h3 className="legal-contact__title">Questions about your privacy?</h3>
            <p>Contact our privacy team at <a href="mailto:privacy@chatify.com" className="legal-contact__link">privacy@chatify.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
