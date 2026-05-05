/**
 * Reset Password page
 */
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, MessageSquare, CheckCircle, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import useAuthStore from '../../store/authStore.js';
import AuthLayout from '../../components/auth/AuthLayout.jsx';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    const result = await resetPassword(token, password);
    setLoading(false);
    if (result.success) {
      setDone(true);
    } else {
      setError(result.error || 'Failed to reset password');
    }
  };

  return (
    <AuthLayout 
      title="New password" 
      subtitle="Enter your new password below"
    >
      {done ? (
        <div className="auth-card__success">
          <CheckCircle size={32} />
          <h3>Password reset!</h3>
          <p>Your password has been updated successfully.</p>
          <Button variant="primary" size="md" onClick={() => navigate('/login')}>
            Sign in
          </Button>
        </div>
      ) : (
        <form className="auth-card__form" onSubmit={handleSubmit}>
          {error && <div className="auth-card__error">{error}</div>}

          <Input
            id="reset-password"
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            placeholder="Min 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
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
            id="reset-confirm"
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            placeholder="Re-enter password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            Reset Password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
