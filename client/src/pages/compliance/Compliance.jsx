/**
 * Compliance Page — GDPR, CCPA, and other standards
 */
import { ShieldCheck, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import './legal.css';

export default function Compliance() {
  const standards = [
    {
      title: "GDPR (General Data Protection Regulation)",
      status: "Compliant",
      desc: "We fully comply with EU data protection laws, providing users with the right to access, rectify, and erase their personal data."
    },
    {
      title: "CCPA (California Consumer Privacy Act)",
      status: "Compliant",
      desc: "California residents have the right to know what personal information is collected and to opt-out of any data sales (we don't sell data)."
    },
    {
      title: "End-to-End Encryption (E2EE)",
      status: "Implemented",
      desc: "Our implementation of the Signal Protocol ensure that only the sender and recipient can read the messages."
    }
  ];

  return (
    <div className="legal-page">
      <div className="legal-container">
        <header className="legal-header">
          <div className="legal-header__badge" style={{ display: 'inline-flex', padding: '6px 12px', background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)', fontSize: '12px', fontWeight: '700', marginBottom: '16px' }}>
            <ShieldCheck size={14} style={{ marginRight: '6px' }} /> Regulatory Compliance
          </div>
          <h1 className="legal-header__title">Compliance & Security</h1>
          <p className="legal-header__update">Last verified: April 30, 2026</p>
        </header>

        <div className="legal-content">
          <div className="legal-card">
            <h2 className="legal-section__title">Our Standards</h2>
            <p>
              Chatify is committed to meeting the highest global standards for data protection 
              and user privacy. We undergo regular internal audits to ensure our platform 
              remains secure and compliant with evolving regulations.
            </p>
          </div>

          <div className="compliance-list" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {standards.map((s, i) => (
              <div key={i} className="compliance-item" style={{ background: 'var(--bg-secondary)', padding: '24px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>{s.title}</h3>
                  <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', padding: '4px 8px', background: 'rgba(var(--success-rgb), 0.1)', color: 'var(--success)' }}>
                    {s.status}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <section className="legal-section" style={{ marginTop: '60px' }}>
            <h2 className="legal-section__title">Reporting Issues</h2>
            <p>
              If you believe you have found a security vulnerability or have concerns about 
              our compliance practices, please reach out to our security team immediately.
            </p>
            <div style={{ padding: '20px', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <AlertCircle size={24} color="var(--accent)" />
              <span style={{ fontWeight: '600' }}>Security Response: <a href="mailto:security@chatify.com" className="legal-contact__link">security@chatify.com</a></span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
