/**
 * Footer — Advanced global footer component
 */
import { Link } from 'react-router-dom';
import {
  MessageSquare, Users, Heart, Send, Code,
  Globe, Shield, Zap, Mail, ArrowRight, Check
} from 'lucide-react';
import { useState } from 'react';
import './layout.css';

import axios from 'axios';
import useUIStore from '../../store/uiStore.js';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const addToast = useUIStore(s => s.addToast);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      await axios.post('/api/system/newsletter/subscribe', { email });
      setSubscribed(true);
      setEmail('');
      addToast({ type: 'success', message: 'Successfully subscribed to newsletter!' });
      setTimeout(() => setSubscribed(false), 5000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to subscribe. Please try again.';
      addToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="footer">
      <div className="footer__container">
        {/* Newsletter Section */}
        <div className="footer__newsletter">
          <div className="footer__newsletter-content">
            <h3 className="footer__newsletter-title">Join our newsletter</h3>
            <p className="footer__newsletter-desc">Get the latest updates, articles, and resources, sent to your inbox weekly.</p>
          </div>
          <form className="footer__newsletter-form" onSubmit={handleSubscribe}>
            <div className="footer__newsletter-input-group">
              <div className="footer__newsletter-input-wrapper">
                <Mail className="footer__newsletter-icon" size={18} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="footer__newsletter-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="footer__newsletter-btn" disabled={loading}>
                {loading ? "..." : subscribed ? <Check size={18} /> : "Subscribe"}
              </button>
            </div>
          </form>
        </div>

        <div className="footer__grid">
          <div className="footer__col footer__col--brand">
            <Link to="/" className="footer__logo">
              <MessageSquare size={24} color="var(--accent)" />
              <span>CHATIFY</span>
            </Link>
            <p className="footer__tagline">
              The world's most secure, real-time messaging platform.
              Engineered for privacy and built for scale.
            </p>
            <div className="footer__socials">
              <a href="#" className="footer__social-link" title="Twitter"><Send size={18} /></a>
              <a href="#" className="footer__social-link" title="GitHub"><Code size={18} /></a>
              <a href="#" className="footer__social-link" title="Discord"><MessageSquare size={18} /></a>
            </div>
            <div className="footer__status">
              <div className="footer__status-indicator" />
              <span>System Status: All systems operational</span>
            </div>
          </div>

          <div className="footer__col">
            <h4 className="footer__title">Product</h4>
            <ul className="footer__list">
              <li><Link to="/features" className="footer__link">Features</Link></li>
              <li><Link to="/explore" className="footer__link">Explore</Link></li>
              <li><Link to="/security" className="footer__link">Security</Link></li>
              <li><Link to="/updates" className="footer__link">Release Notes</Link></li>
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__title">Resources</h4>
            <ul className="footer__list">
              <li><Link to="/docs" className="footer__link">Documentation</Link></li>
              <li><Link to="/help" className="footer__link">Help Center</Link></li>
              <li><Link to="/blog" className="footer__link">Official Blog</Link></li>
              <li><Link to="/community" className="footer__link">Community Hub</Link></li>
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__title">Legal</h4>
            <ul className="footer__list">
              <li><Link to="/privacy" className="footer__link">Privacy Policy</Link></li>
              <li><Link to="/terms" className="footer__link">Terms of Service</Link></li>
              <li><Link to="/cookies" className="footer__link">Cookies Policy</Link></li>
              <li><Link to="/legal" className="footer__link">Compliance</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <div className="footer__bottom-left">
            <p className="footer__copyright">
              © {new Date().getFullYear()} Chatify Labs Inc.
            </p>
            <div className="footer__bottom-links">
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/cookies">Cookies</Link>
            </div>
          </div>
          <div className="footer__bottom-right">
            <p className="footer__made-with">
              Crafted with <Heart size={14} fill="var(--danger)" color="var(--danger)" /> by <strong>Chatify Team</strong>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
