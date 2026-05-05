/**
 * Official Blog Page — Updates and insights from the Chatify team
 */
import { Calendar, User, Clock, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import './blog.css';

export default function Blog() {
  const posts = [
    {
      id: 1,
      tag: "Security",
      title: "How We Implemented E2E Encryption for Millions of Users",
      excerpt: "An in-depth look at our Signal Protocol implementation and how we ensure your data stays private and secure at scale.",
      author: "Alex Rivera",
      date: "Apr 28, 2026",
      readTime: "12 min read"
    },
    {
      id: 2,
      tag: "Engineering",
      title: "Reducing WebSocket Latency by 40% with New Edge Hubs",
      excerpt: "Our engineering team recently deployed new edge server hubs globally. Here is how it affects your real-time messaging experience.",
      author: "Sarah Chen",
      date: "Apr 25, 2026",
      readTime: "8 min read"
    },
    {
      id: 3,
      tag: "Product",
      title: "Introducing Chatify Communities: A New Way to Connect",
      excerpt: "Discover how our new public and private communities work, and how you can join the global conversation today.",
      author: "Jason Miller",
      date: "Apr 20, 2026",
      readTime: "5 min read"
    }
  ];

  return (
    <div className="blog-page">
      <header className="blog-hero">
        <div className="blog-hero__badge">Official Blog</div>
        <h1 className="blog-hero__title">Stories & Insights.</h1>
        <p className="blog-hero__desc">
          Stay updated with the latest news, engineering breakthroughs, 
          and product updates from the Chatify team.
        </p>
      </header>

      <main className="blog-container">
        {/* Featured Post */}
        <section className="blog-featured">
          <div className="blog-featured__img" />
          <div className="blog-featured__content">
            <span className="blog-featured__tag">Featured Update</span>
            <h2 className="blog-featured__title">Announcing Chatify 2.0: The Future of Private Messaging</h2>
            <p className="blog-featured__excerpt">
              Today marks a significant milestone in our journey. Chatify 2.0 brings a complete 
              architectural overhaul, military-grade security enhancements, and a stunning 
              new interface designed for speed.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /> Mark Thompson</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} /> Apr 30, 2026</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} /> 15 min read</div>
            </div>
            <Button variant="primary">Read Full Article <ArrowRight size={18} style={{ marginLeft: '8px' }} /></Button>
          </div>
        </section>

        {/* Post Grid */}
        <div className="blog-grid">
          {posts.map(post => (
            <article className="blog-card" key={post.id}>
              <div className="blog-card__img" />
              <div className="blog-card__content">
                <span className="blog-card__tag">{post.tag}</span>
                <h3 className="blog-card__title">{post.title}</h3>
                <p className="blog-card__excerpt">{post.excerpt}</p>
                <div className="blog-card__meta">
                  <span>By {post.author}</span>
                  <span>{post.date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="blog-load-more">
          <Button variant="secondary" size="lg">Load More Articles</Button>
        </div>
      </main>
    </div>
  );
}
