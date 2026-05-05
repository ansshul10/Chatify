/**
 * Community Hub Page — Explore and join Chatify communities
 */
import { Users, Globe, Shield, MessageSquare, Zap, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import './community-hub.css';

export default function CommunityHub() {
  const hubs = [
    {
      icon: <Globe size={28} />,
      title: "Global Lounge",
      desc: "The heart of Chatify. Meet people from all over the world in our largest public space.",
      members: "125k+",
      tag: "Public"
    },
    {
      icon: <MessageSquare size={28} />,
      title: "Tech & Dev",
      desc: "Discuss the latest in technology, AI, and software engineering with industry experts.",
      members: "42k+",
      tag: "Public"
    },
    {
      icon: <Heart size={28} />,
      title: "Health & Wellness",
      desc: "A safe space to share journeys, tips, and support for a healthier lifestyle.",
      members: "18k+",
      tag: "Verified Only"
    }
  ];

  return (
    <div className="community-page">
      <header className="community-hero">
        <div style={{ display: 'inline-flex', padding: '8px 16px', background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '800', marginBottom: '24px' }}>
          Connect • Share • Grow
        </div>
        <h1 className="community-hero__title">Welcome to the Hub.</h1>
        <p className="community-hero__subtitle">
          Join thousands of specialized communities or create your own secure 
          space to connect with people who share your passions.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <Button variant="primary" size="lg">Explore Communities</Button>
          <Button variant="secondary" size="lg">Start a Community</Button>
        </div>
      </header>

      <main className="community-container">
        {/* Stats Section */}
        <section className="community-section">
          <div className="community-stats">
            <div className="stat-item">
              <span className="stat-item__value">500k+</span>
              <span className="stat-item__label">Daily Messages</span>
            </div>
            <div className="stat-item">
              <span className="stat-item__value">25k+</span>
              <span className="stat-item__label">Active Hubs</span>
            </div>
            <div className="stat-item">
              <span className="stat-item__value">1.2M</span>
              <span className="stat-item__label">Members</span>
            </div>
          </div>
        </section>

        {/* Featured Communities */}
        <section className="community-section">
          <h2 className="community-section__title">Featured Communities</h2>
          <div className="community-grid">
            {hubs.map((hub, i) => (
              <div className="community-card" key={i}>
                <div className="community-card__header">
                  <div className="community-card__icon">{hub.icon}</div>
                  <span className="community-card__members">{hub.members} members</span>
                </div>
                <h3 className="community-card__title">{hub.title}</h3>
                <p className="community-card__desc">{hub.desc}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>{hub.tag}</span>
                  <Button variant="text">Join Room <ArrowRight size={16} style={{ marginLeft: '8px' }} /></Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="community-cta">
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '20px' }}>Your space, your rules.</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.6' }}>
            Can't find what you're looking for? Start your own community and 
            invite your friends. Complete control over privacy and moderation.
          </p>
          <Button variant="primary" size="lg">Create Your Hub</Button>
        </section>
      </main>
    </div>
  );
}
