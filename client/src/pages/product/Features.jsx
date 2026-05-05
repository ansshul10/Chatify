/**
 * Features Page — Showcasing Chatify capabilities
 */
import { Shield, Lock, Zap, Users, Globe, Code, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import './features.css';

export default function Features() {
  const features = [
    {
      icon: <Lock size={28} />,
      title: "End-to-End Encryption",
      desc: "Your privacy is our mission. Every message is encrypted on your device and can only be read by the recipient.",
      items: ["Signal Protocol v3", "Zero-knowledge storage", "Self-destructing keys"]
    },
    {
      icon: <Zap size={28} />,
      title: "Real-time Synchronization",
      desc: "Experience lightning-fast communication powered by state-of-the-art WebSockets technology.",
      items: ["Ultra-low latency", "Instant read receipts", "Real-time typing indicators"]
    },
    {
      icon: <Shield size={28} />,
      title: "Private & Secure",
      desc: "No tracking, no data selling, no hidden logs. We don't even store your metadata.",
      items: ["No IP tracking", "Anonymous guest mode", "Two-factor authentication"]
    },
    {
      icon: <Users size={28} />,
      title: "Community First",
      desc: "Connect with friends or meet new like-minded individuals in a safe environment.",
      items: ["Global search", "Friend request system", "User blocking & reporting"]
    },
    {
      icon: <Globe size={28} />,
      title: "Universal Access",
      desc: "Chatify works everywhere you do. Seamlessly transition between devices.",
      items: ["Desktop & Mobile", "Web optimized", "No installation required"]
    },
    {
      icon: <Code size={28} />,
      title: "Developer Friendly",
      desc: "Built with modern technologies and a clean, modular architecture for ultimate performance.",
      items: ["React & Node.js", "MongoDB optimized", "Open-source mindset"]
    }
  ];

  return (
    <div className="features-page">
      <header className="features-hero">
        <div className="features-hero__badge">Platform Features</div>
        <h1 className="features-hero__title">
          Built for <span className="text-gradient">Privacy.</span><br />
          Engineered for <span className="text-gradient">Speed.</span>
        </h1>
        <p className="features-hero__subtitle">
          Chatify combines military-grade security with an intuitive, 
          lightning-fast interface to redefine modern communication.
        </p>
      </header>

      <section className="features-grid">
        {features.map((f, i) => (
          <div className="feature-card" key={i}>
            <div className="feature-card__icon">
              {f.icon}
            </div>
            <h3 className="feature-card__title">{f.title}</h3>
            <p className="feature-card__desc">{f.desc}</p>
            <ul className="feature-card__list">
              {f.items.map((item, j) => (
                <li className="feature-card__list-item" key={j}>
                  <CheckCircle2 size={14} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="features-cta">
        <div className="features-cta__content">
          <h2 className="features-cta__title">Ready to switch to secure?</h2>
          <p className="features-cta__desc">
            Join thousands of users who trust Chatify for their most sensitive conversations. 
            Start messaging for free today.
          </p>
          <div className="features-cta__btns">
            <Link to="/register">
              <Button variant="primary" size="lg">Create Secure Account</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">Log In</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
