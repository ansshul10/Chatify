/**
 * CookieConsent — High-end cookie preference manager
 */
import { useState, useEffect } from 'react';
import { Cookie, X, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import Button from './Button.jsx';
import './privacy-banner.css';

export default function PrivacyBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    marketing: false
  });

  useEffect(() => {
    const consent = localStorage.getItem('chatify_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    saveConsent({ essential: true, analytics: true, marketing: true });
  };

  const handleRejectAll = () => {
    saveConsent({ essential: true, analytics: false, marketing: false });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const saveConsent = (data) => {
    localStorage.setItem('chatify_cookie_consent', JSON.stringify({
      ...data,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent">
      <div className="cookie-card">
        <div className="cookie-card__header">
          <div className="cookie-card__icon">
            <Cookie size={24} />
          </div>
          <div>
            <h3 className="cookie-card__title">Cookie Preferences</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Manage how we use cookies to improve your experience.
            </p>
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <p className="cookie-card__desc">
          We use cookies to enhance your browsing experience, serve personalized ads or content, 
          and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
          Read our <a href="/cookies">Cookie Policy</a> for more details.
        </p>

        {isExpanded && (
          <div className="cookie-card__customize animate-fade-in">
            <div className="cookie-option">
              <div className="cookie-option__info">
                <span className="cookie-option__label">Essential Cookies</span>
                <span className="cookie-option__desc">Required for the site to function properly. Cannot be disabled.</span>
              </div>
              <ShieldCheck size={20} color="var(--success)" />
            </div>

            <div className="cookie-option">
              <div className="cookie-option__info">
                <span className="cookie-option__label">Analytics Cookies</span>
                <span className="cookie-option__desc">Help us understand how visitors interact with our website.</span>
              </div>
              <div 
                className={`settings__toggle ${preferences.analytics ? 'settings__toggle--on' : ''}`}
                onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
              >
                <div className="settings__toggle-thumb" />
              </div>
            </div>

            <div className="cookie-option">
              <div className="cookie-option__info">
                <span className="cookie-option__label">Marketing Cookies</span>
                <span className="cookie-option__desc">Used to track visitors across websites to display relevant ads.</span>
              </div>
              <div 
                className={`settings__toggle ${preferences.marketing ? 'settings__toggle--on' : ''}`}
                onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
              >
                <div className="settings__toggle-thumb" />
              </div>
            </div>
          </div>
        )}

        <div className="cookie-card__actions">
          {isExpanded ? (
            <Button variant="primary" onClick={handleSavePreferences} fullWidth>
              Save My Preferences
            </Button>
          ) : (
            <>
              <Button variant="primary" onClick={handleAcceptAll}>
                Accept All
              </Button>
              <Button variant="secondary" onClick={handleRejectAll}>
                Reject All
              </Button>
              <Button variant="ghost" onClick={() => setIsExpanded(true)}>
                Customize <ChevronDown size={16} style={{ marginLeft: 4 }} />
              </Button>
            </>
          )}
          {isExpanded && (
             <Button variant="ghost" onClick={() => setIsExpanded(false)} fullWidth>
                Back <ChevronUp size={16} style={{ marginLeft: 4 }} />
             </Button>
          )}
        </div>
      </div>
    </div>
  );
}
