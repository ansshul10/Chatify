/**
 * Documentation Page — User Guide for Chatify
 */
import { 
  Book, Zap, Shield, Globe, 
  ChevronRight, Info, CheckCircle2 
} from 'lucide-react';
import './documentation.css';

export default function Documentation() {
  const sidebar = [
    {
      title: "Getting Started",
      links: ["Introduction", "Core Concepts"]
    },
    {
      title: "Features",
      links: ["Real-time Messaging", "End-to-End Encryption"]
    }
  ];

  return (
    <div className="docs-page">
      <aside className="docs-sidebar">
        {sidebar.map((section, i) => (
          <div className="docs-sidebar__section" key={i}>
            <h3 className="docs-sidebar__title">{section.title}</h3>
            <ul className="docs-sidebar__list">
              {section.links.map((link, j) => (
                <li className="docs-sidebar__item" key={j}>
                  <a href={`#${link.toLowerCase().replace(/ /g, '-')}`} className="docs-sidebar__link">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      <main className="docs-content">
        <header className="docs-header">
          <div className="docs-header__badge">User Guide</div>
          <h1 className="docs-header__title">Documentation</h1>
          <p className="docs-header__desc">
            Everything you need to know about using Chatify to communicate 
            securely and effectively.
          </p>
        </header>

        <article className="docs-article">
          <section id="introduction">
            <h2>Introduction</h2>
            <p>
              Chatify is a high-performance messaging platform designed with a "security-first" 
              philosophy. It provides a simple, intuitive interface for private communication, 
              real-time updates, and cross-platform synchronization.
            </p>
            <div className="docs-info-box">
              <div className="docs-info-box__title">
                <Info size={18} />
                <span>Our Vision</span>
              </div>
              <p>
                We believe that private communication should be accessible to everyone. 
                Chatify is built to ensure that your private conversations stay truly private.
              </p>
            </div>
          </section>

          <section id="core-concepts" style={{ marginTop: '60px' }}>
            <h2>Core Concepts</h2>
            <p>
              To get the most out of Chatify, it's important to understand how our platform 
              handles your data and connections.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <li style={{ display: 'flex', gap: '16px', background: 'var(--bg-secondary)', padding: '20px', border: '1px solid var(--border)' }}>
                <CheckCircle2 color="var(--success)" size={20} />
                <div>
                  <h4 style={{ marginBottom: '4px' }}>Real-time Delivery</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Messages are delivered instantly across all your active devices.</p>
                </div>
              </li>
              <li style={{ display: 'flex', gap: '16px', background: 'var(--bg-secondary)', padding: '20px', border: '1px solid var(--border)' }}>
                <CheckCircle2 color="var(--success)" size={20} />
                <div>
                  <h4 style={{ marginBottom: '4px' }}>Privacy by Design</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>We don't track your location, your metadata, or your contacts.</p>
                </div>
              </li>
            </ul>
          </section>

          <section id="end-to-end-encryption" style={{ marginTop: '80px' }}>
            <h2>End-to-End Encryption</h2>
            <p>
              Security is not an option; it's a requirement. Chatify uses state-of-the-art 
              encryption protocols. This ensures that even if our servers were compromised, 
              your messages would remain unreadable.
            </p>
            <div style={{ display: 'flex', gap: '20px', marginTop: '32px' }}>
              <div style={{ flex: 1, padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <Shield size={24} color="var(--accent)" style={{ marginBottom: '16px' }} />
                <h4 style={{ marginBottom: '12px' }}>Zero-Knowledge</h4>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>We don't hold your keys. Your data is your own.</p>
              </div>
              <div style={{ flex: 1, padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <Zap size={24} color="var(--warning)" style={{ marginBottom: '16px' }} />
                <h4 style={{ marginBottom: '12px' }}>Instant Sync</h4>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>Encryption happens in milliseconds without lag.</p>
              </div>
            </div>
          </section>
        </article>

        <footer style={{ marginTop: '100px', paddingTop: '40px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Was this page helpful?
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="/legal" className="docs-sidebar__link" style={{ padding: 0 }}>View Compliance</a>
            <a href="/features" className="docs-sidebar__link" style={{ padding: 0 }}>Next: Features <ChevronRight size={14} /></a>
          </div>
        </footer>
      </main>
    </div>
  );
}
