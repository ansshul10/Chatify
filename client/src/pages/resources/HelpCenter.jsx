/**
 * Help Center Page — Advanced support and FAQ
 */
import { 
  Search, Shield, Zap, Users, 
  MessageCircle, Settings, Key, 
  Plus, Minus, ChevronRight, Mail, Phone 
} from 'lucide-react';
import { useState } from 'react';
import './help-center.css';

export default function HelpCenter() {
  const [activeFaq, setActiveFaq] = useState(null);

  const categories = [
    {
      icon: <Users size={24} />,
      title: "Account & Profile",
      desc: "Manage your profile, account settings, and preferences."
    },
    {
      icon: <Shield size={24} />,
      title: "Privacy & Security",
      desc: "Encryption details, two-factor auth, and data safety."
    },
    {
      icon: <Zap size={24} />,
      title: "Troubleshooting",
      desc: "Fix common issues with connections or notifications."
    },
    {
      icon: <MessageCircle size={24} />,
      title: "Chat Features",
      desc: "Learn about messaging, formatting, and media sharing."
    }
  ];

  const faqs = [
    {
      q: "Is Chatify really end-to-end encrypted?",
      a: "Yes! Every message sent on Chatify is encrypted before it leaves your device using the Signal Protocol. We have no way to read your private conversations."
    },
    {
      q: "Can I use Chatify on multiple devices?",
      a: "Absolutely. Chatify syncs your account seamlessly across desktop, web, and mobile devices while maintaining encryption."
    },
    {
      q: "What happens if I lose my encryption key?",
      a: "Because we prioritize privacy, we do not store your keys. If you lose access and don't have a backup, your previous encrypted messages cannot be recovered."
    },
    {
      q: "Is there a limit on file sharing size?",
      a: "Currently, you can share files up to 100MB per message. This limit ensures fast delivery and optimal performance for all users."
    }
  ];

  return (
    <div className="help-page">
      <header className="help-hero">
        <h1 className="help-hero__title">How can we help?</h1>
        <div className="help-search">
          <Search className="help-search__icon" size={20} />
          <input 
            type="text" 
            placeholder="Search for articles, guides, or FAQs..." 
            className="help-search__input"
          />
        </div>
      </header>

      <main className="help-container">
        <section className="help-grid">
          {categories.map((cat, i) => (
            <div className="help-card" key={i}>
              <div className="help-card__icon">{cat.icon}</div>
              <h3 className="help-card__title">{cat.title}</h3>
              <p className="help-card__desc">{cat.desc}</p>
            </div>
          ))}
        </section>

        <section className="help-faqs">
          <h2 className="help-section-title">Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div 
                key={i} 
                className={`faq-item ${activeFaq === i ? 'faq-item--active' : ''}`}
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
              >
                <div className="faq-item__question">
                  <span>{faq.q}</span>
                  {activeFaq === i ? <Minus size={18} /> : <Plus size={18} />}
                </div>
                <div className="faq-item__answer">
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="help-contact">
          <h2 className="help-contact__title">Still need help?</h2>
          <p className="help-contact__desc">
            Our support team is available 24/7 to help you with any technical or account issues.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Mail size={20} />
              <span>support@chatify.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Phone size={20} />
              <span>+1 (800) CHATIFY</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
