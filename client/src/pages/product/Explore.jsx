/**
 * Explore Page — Discover public rooms and communities
 */
import { Search, Hash, Users, Zap, TrendingUp, Compass, Plus, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import './explore.css';

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Technology', 'Design', 'Crypto', 'Gaming', 'Music', 'Health'];

  const rooms = [
    {
      title: "Tech Innovators",
      desc: "Discussing the future of AI, Quantum Computing, and beyond.",
      users: 1240,
      tag: "Technology",
      trending: true
    },
    {
      title: "Creative Collective",
      desc: "A hub for designers, illustrators, and UI/UX enthusiasts.",
      users: 850,
      tag: "Design"
    },
    {
      title: "Crypto Whale Club",
      desc: "Real-time analysis of market trends and blockchain tech.",
      users: 3200,
      tag: "Crypto",
      trending: true
    },
    {
      title: "Gamer Haven",
      desc: "Lobby for esports discussion and weekend tournaments.",
      users: 1560,
      tag: "Gaming"
    },
    {
      title: "Lo-Fi Beats Room",
      desc: "24/7 chill vibes and music production tips.",
      users: 420,
      tag: "Music"
    },
    {
      title: "Wellness & Mind",
      desc: "Sharing tips for mental health and physical fitness.",
      users: 980,
      tag: "Health"
    }
  ];

  const filteredRooms = activeCategory === 'All' 
    ? rooms 
    : rooms.filter(r => r.tag === activeCategory);

  return (
    <div className="explore-page">
      <header className="explore-hero">
        <h1 className="explore-hero__title">Explore Communities</h1>
        <p className="explore-hero__subtitle">
          Discover public chat rooms, join trending discussions, and connect 
          with people who share your passions.
        </p>
      </header>

      <main className="explore-container">
        <div className="explore-search">
          <input 
            type="text" 
            className="explore-search__input" 
            placeholder="Search for rooms, topics, or people..." 
          />
          <Search className="explore-search__icon" size={24} />
        </div>

        <div className="explore-categories">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`category-pill ${activeCategory === cat ? 'category-pill--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <section className="explore-section">
          <div className="explore-section__header">
            <h2 className="explore-section__title">
              <TrendingUp size={24} />
              Trending Now
            </h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>

          <div className="explore-grid">
            {filteredRooms.map((room, i) => (
              <div className="room-card" key={i}>
                <div className="room-card__header">
                  <span className="room-card__tag">{room.tag}</span>
                  {room.trending && <Zap size={14} color="var(--warning)" fill="var(--warning)" />}
                </div>
                <div className="room-card__body">
                  <h3 className="room-card__title">{room.title}</h3>
                  <p className="room-card__desc">{room.desc}</p>
                </div>
                <div className="room-card__footer">
                  <div className="room-card__users">
                    <Users size={16} />
                    <span>{room.users.toLocaleString()} online</span>
                  </div>
                  <Button variant="secondary" size="sm">
                    Join <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="explore-section" style={{ marginTop: '80px', textAlign: 'center' }}>
          <div className="explore-cta" style={{ background: 'var(--bg-secondary)', padding: '60px', border: '1px solid var(--border)' }}>
            <Compass size={48} style={{ color: 'var(--accent)', marginBottom: '20px' }} />
            <h2 className="explore-section__title" style={{ justifyContent: 'center', marginBottom: '16px' }}>
              Can't find what you're looking for?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Create your own community and invite your friends.
            </p>
            <Button variant="primary" size="lg">
              <Plus size={20} style={{ marginRight: '8px' }} />
              Create New Room
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
