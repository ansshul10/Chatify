/**
 * AuthLayout — Shared 2-column layout for auth pages
 */
import { MessageSquare, Shield, Zap, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../pages/auth/auth.css';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-page">
      <div className="auth-split">
        {/* Left Side: Content Rich Marketing */}
        <div className="auth-content">
          <div className="auth-content__pattern" />
          <div className="auth-content__orb" />
          <div className="auth-content__inner">



            <h1 className="auth-content__title">
              Connect with <span className="text-gradient">confidence.</span>
            </h1>
            <p className="auth-card__subtitle" style={{ fontSize: '1.1rem', maxWidth: '400px' }}>
              Join 2 million+ users who prioritize their digital sovereignty
              with our zero-knowledge architecture.
            </p>

            <div className="auth-content__features">
              <div className="auth-feature">
                <div className="auth-feature__icon"><Shield size={20} /></div>
                <div className="auth-feature__text">
                  <h4>End-to-End Encryption</h4>
                  <p>Your messages are yours alone. Not even we can read them.</p>
                </div>
              </div>
              <div className="auth-feature">
                <div className="auth-feature__icon"><Zap size={20} /></div>
                <div className="auth-feature__text">
                  <h4>Real-Time Performance</h4>
                  <p>Experience sub-50ms latency with our global edge network.</p>
                </div>
              </div>
              <div className="auth-feature">
                <div className="auth-feature__icon"><Lock size={20} /></div>
                <div className="auth-feature__text">
                  <h4>Zero Metadata Logging</h4>
                  <p>We don't track who you talk to or when. Total anonymity.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="auth-form-side">
          <div className="auth-card">
            <div className="auth-card__header">
              <h2 className="auth-card__title">{title}</h2>
              <p className="auth-card__subtitle">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
