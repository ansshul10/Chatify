/**
 * Forgot Password page
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, ArrowLeft, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import useAuthStore from '../../store/authStore.js';
import AuthLayout from '../../components/auth/AuthLayout.jsx';

export default function ForgotPassword() {
  const { forgotPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await forgotPassword(email);
    setLoading(false);
    if (result.success) {
      setSent(true);
    } else {
      setError(result.error || 'Failed to send reset email');
    }
  };

  return (
    <AuthLayout 
      title="Reset password" 
      subtitle="Enter your email and we'll send you a reset link"
    >
      {sent ? (
        <div className="auth-card__success">
          <CheckCircle size={32} />
          <h3>Check your email</h3>
          <p>We've sent a password reset link to <strong>{email}</strong></p>
        </div>
      ) : (
        <form className="auth-card__form" onSubmit={handleSubmit}>
          {error && <div className="auth-card__error">{error}</div>}
          <Input
            id="forgot-email"
            label="Email address"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            Send Reset Link
          </Button>
        </form>
      )}

      <div className="auth-card__footer">
        <Link to="/login">
          <ArrowLeft size={14} /> Back to login
        </Link>
      </div>
    </AuthLayout>
  );
}
