/**
 * Navbar — Premium global navigation
 */
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, LogOut, Sun, Moon, ChevronRight, X } from 'lucide-react';
import useAuthStore from '../../store/authStore.js';
import useUIStore from '../../store/uiStore.js';
import Avatar from '../ui/Avatar.jsx';
import './layout.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for navbar elevation
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav__inner">
          {/* Brand */}
          <Link to="/" className="nav__brand">
            <MessageSquare size={20} strokeWidth={2.5} />
            <span>Chatify</span>
          </Link>

          {/* Center: Desktop navigation */}
          <div className="nav__center">
            <Link to="/" className={`nav__item ${location.pathname === '/' ? 'nav__item--active' : ''}`}>Home</Link>
            <Link to="/explore" className={`nav__item ${location.pathname === '/explore' ? 'nav__item--active' : ''}`}>Explore</Link>
            <Link to="/features" className={`nav__item ${location.pathname === '/features' ? 'nav__item--active' : ''}`}>Features</Link>
            {isAuthenticated && (
              <Link to="/chat" className={`nav__item ${isChat ? 'nav__item--active' : ''}`}>Messages</Link>
            )}
          </div>

          {/* Right side */}
          <div className="nav__right">
            <button onClick={toggleTheme} className="nav__icon-btn" title="Toggle Theme" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="nav__desktop-only">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="nav__avatar-chip">
                    <Avatar src={user?.avatar} name={user?.displayName || user?.username} size={30} />
                    <span className="nav__avatar-name">{user?.displayName || user?.username}</span>
                  </Link>
                  <button onClick={logout} className="nav__icon-btn nav__icon-btn--danger" title="Logout" aria-label="Logout">
                    <LogOut size={17} />
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav__text-btn">Sign in</Link>
                  <Link to="/register" className="nav__cta">Get Started</Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="nav__hamburger"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              <span className="nav__hamburger-line" />
              <span className="nav__hamburger-line" />
              <span className="nav__hamburger-line" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div className={`nav-overlay ${mobileOpen ? 'nav-overlay--visible' : ''}`}>
        <div className="nav-overlay__backdrop" onClick={closeMobile} />
        <div className={`nav-overlay__panel ${mobileOpen ? 'nav-overlay__panel--open' : ''}`}>
          <div className="nav-overlay__header">
            <span className="nav-overlay__brand">Chatify</span>
            <button className="nav-overlay__close" onClick={closeMobile}>
              <X size={20} />
            </button>
          </div>
          <div className="nav-overlay__scroll">
            <div className="nav-overlay__section">

              <Link to="/" className="nav-overlay__link" onClick={closeMobile}>
                <span>Home</span><ChevronRight size={16} />
              </Link>
              <Link to="/explore" className="nav-overlay__link" onClick={closeMobile}>
                <span>Explore</span><ChevronRight size={16} />
              </Link>
              <Link to="/features" className="nav-overlay__link" onClick={closeMobile}>
                <span>Features</span><ChevronRight size={16} />
              </Link>
              {isAuthenticated && (
                <Link to="/chat" className="nav-overlay__link" onClick={closeMobile}>
                  <span>Messages</span><ChevronRight size={16} />
                </Link>
              )}
            </div>

            <div className="nav-overlay__section">
              <span className="nav-overlay__label">Account</span>
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="nav-overlay__user" onClick={closeMobile}>
                    <Avatar src={user?.avatar} name={user?.username} size={36} />
                    <div className="nav-overlay__user-info">
                      <strong>{user?.displayName || user?.username}</strong>
                      <small>View profile</small>
                    </div>
                  </Link>
                  <button className="nav-overlay__logout" onClick={() => { logout(); closeMobile(); }}>
                    <LogOut size={16} />
                    <span>Sign out</span>
                  </button>
                </>
              ) : (
                <div className="nav-overlay__auth">
                  <Link to="/login" className="nav-overlay__auth-link" onClick={closeMobile}>Sign in</Link>
                  <Link to="/register" className="nav-overlay__auth-cta" onClick={closeMobile}>Create Account</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
