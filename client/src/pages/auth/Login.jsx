/**
 * Login page
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, MessageSquare, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import useAuthStore from '../../store/authStore.js';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import useUIStore from '../../store/uiStore.js';
import { Play, Wand2, Globe } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginAnonymous, error, clearError } = useAuthStore();
  const { isFeatureEnabled, config } = useUIStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    const result = await login(identifier, password, show2FA ? totpCode : undefined);
    setLoading(false);
    
    if (result.requires2FA) {
      setShow2FA(true);
      return;
    }
    
    if (result.success) {
      const currentUser = useAuthStore.getState().user;
      if (['admin', 'moderator'].includes(currentUser?.role)) {
        navigate('/admin');
      } else {
        navigate('/chat');
      }
    }
  };

  const handleAnonymous = async () => {
    setLoading(true);
    const result = await loginAnonymous();
    setLoading(false);
    if (result.success) navigate('/chat');
  };

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Sign in to continue to your messages"
    >
      <form className="auth-card__form" onSubmit={handleSubmit}>
        {error && <div className="auth-card__error">{error}</div>}

        <Input
          id="login-identifier"
          label="Email or Username"
          type="text"
          icon={Mail}
          placeholder="you@example.com or username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          autoFocus
        />

        <Input
          id="login-password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          suffix={
            <button
              type="button"
              className="auth-card__toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {show2FA && (
          <Input
            id="login-totp"
            label="2FA Code"
            type="text"
            placeholder="Enter 6-digit code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            maxLength={6}
          />
        )}

        <div className="auth-card__forgot">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          id="login-submit"
        >
          Sign in
        </Button>
      </form>

      <div className="auth-card__divider">
        <span>or</span>
      </div>

      <div className="auth-card__socials" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '1rem' }}>
        {isFeatureEnabled('FEATURE_GOOGLE_OAUTH') && (
          <Button variant="secondary" size="lg" fullWidth icon={Globe}>
            Continue with Google
          </Button>
        )}

        {isFeatureEnabled('FEATURE_MAGIC_LINK') && (
          <Button variant="secondary" size="lg" fullWidth icon={Wand2}>
            Sign in with Magic Link
          </Button>
        )}

        {isFeatureEnabled('FEATURE_ANONYMOUS_CHAT') && (
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleAnonymous}
            id="login-anonymous"
            icon={Play}
          >
            Continue as Anonymous
          </Button>
        )}
      </div>

      <div className="auth-card__footer">
        Don't have an account? <Link to="/register">Sign up</Link>
      </div>
    </AuthLayout>
  );
}
