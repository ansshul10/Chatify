/**
 * Security Page — Deep dive into Chatify's security architecture
 */
import { Shield, Lock, Eye, Zap, Key, Server, CheckCircle } from 'lucide-react';
import './Security.css';

export default function Security() {
  const pillars = [
    {
      icon: <Lock size={32} />,
      title: "End-to-End Encryption",
      desc: "Every single message, file, and call is encrypted on your device and only decrypted by the recipient. No middleman, including us, can read your data."
    },
    {
      icon: <Eye size={32} />,
      title: "Zero-Knowledge Architecture",
      desc: "Our servers are designed to know nothing about you. We don't store keys, we don't track metadata, and we don't build profiles."
    },
    {
      icon: <Shield size={32} />,
      title: "Regular Security Audits",
      desc: "We partner with top global security firms to perform rigorous penetration testing and code audits to ensure our platform remains impenetrable."
    }
  ];

  return (
    <div className="security-page">
      <header className="security-hero">
        <div className="security-hero__badge">Military Grade Security</div>
        <h1 className="security-hero__title">Privacy is a Right.</h1>
        <p className="security-hero__subtitle">
          Chatify is built from the ground up to protect your most sensitive 
          conversations with state-of-the-art cryptographic protocols.
        </p>
      </header>

      <main className="security-container">
        <section className="security-grid">
          {pillars.map((p, i) => (
            <div className="security-card" key={i}>
              <div className="security-card__icon">{p.icon}</div>
              <h3 className="security-card__title">{p.title}</h3>
              <p className="security-card__desc">{p.desc}</p>
            </div>
          ))}
        </section>

        <section className="security-protocol">
          <div className="protocol-content">
            <h2 className="protocol-content__title">The Signal Protocol</h2>
            <p className="protocol-content__desc">
              We use the industry-leading Signal Protocol for our end-to-end encryption. 
              This provides Perfect Forward Secrecy (PFS), meaning even if a key were 
              compromised, it wouldn't affect the security of past or future messages.
            </p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ display: 'flex', gap: '12px', marginBottom: '16px', fontWeight: '600' }}>
                <CheckCircle size={20} color="var(--success)" /> Double Ratchet Algorithm
              </li>
              <li style={{ display: 'flex', gap: '12px', marginBottom: '16px', fontWeight: '600' }}>
                <CheckCircle size={20} color="var(--success)" /> Pre-keys for asynchronous messaging
              </li>
              <li style={{ display: 'flex', gap: '12px', fontWeight: '600' }}>
                <CheckCircle size={20} color="var(--success)" /> Diffie-Hellman key exchange
              </li>
            </ul>
          </div>
          <div className="protocol-visual" style={{ background: 'var(--bg)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Zap size={20} color="var(--accent)" />
              <div style={{ height: '4px', flex: 1, background: 'var(--accent)', borderRadius: '2px' }} />
              <Lock size={20} color="var(--accent)" />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
              Diagram: Instant encryption and verification across edge hubs.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
