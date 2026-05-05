/**
 * Register page
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, MessageSquare, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import useAuthStore from '../../store/authStore.js';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import useUIStore from '../../store/uiStore.js';
import { Globe, Wand2 } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuthStore();
  const { isFeatureEnabled, config } = useUIStore();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (username.length < 3) errors.username = 'Username must be at least 3 characters';
    if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;
    setLoading(true);
    const result = await register(email, username, password);
    setLoading(false);
    if (result.success) navigate('/chat');
  };

  return (
    <AuthLayout 
      title="Create account" 
      subtitle="Join Chatify and start messaging"
    >
      <form className="auth-card__form" onSubmit={handleSubmit}>
        {error && <div className="auth-card__error">{error}</div>}

        <Input
          id="register-email"
          label="Email"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <Input
          id="register-username"
          label="Username"
          type="text"
          icon={User}
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={fieldErrors.username}
          required
        />

        <Input
          id="register-password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          placeholder="Min 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
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

        <Input
          id="register-confirm"
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          id="register-submit"
        >
          Create Account
        </Button>
      </form>

      <div className="auth-card__divider">
        <span>or</span>
      </div>

      <div className="auth-card__socials" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isFeatureEnabled('FEATURE_GOOGLE_OAUTH') && (
          <Button variant="secondary" size="lg" fullWidth icon={Globe}>
            Sign up with Google
          </Button>
        )}

        {isFeatureEnabled('FEATURE_MAGIC_LINK') && (
          <Button variant="secondary" size="lg" fullWidth icon={Wand2}>
            Sign up with Magic Link
          </Button>
        )}
      </div>

      <div className="auth-card__footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </div>
    </AuthLayout>
  );
}
