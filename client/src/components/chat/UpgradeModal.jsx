/**
 * UpgradeModal — Convert anonymous account to registered
 */
import { useState } from 'react';
import { Mail, Lock, User as UserIcon, ShieldCheck } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import useAuthStore from '../../store/authStore.js';

export default function UpgradeModal({ isOpen, onClose }) {
  const upgrade = useAuthStore((s) => s.upgrade);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await upgrade(email, username, password);
    setLoading(false);
    if (result.success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { onClose(); clearError(); }}
      title="Create Official Account"
      width={400}
    >
      <div className="upgrade-modal">
        <div className="upgrade-modal__header">
          <ShieldCheck size={32} color="var(--success)" />
          <p>Register now to unlock all features and secure your account permanently.</p>
        </div>

        <form className="upgrade-modal__form" onSubmit={handleSubmit}>
          {error && <div className="upgrade-modal__error">{error}</div>}
          
          <Input
            id="upgrade-email"
            label="Email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="upgrade-username"
            label="Username"
            type="text"
            icon={UserIcon}
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <Input
            id="upgrade-password"
            label="Password"
            type="password"
            icon={Lock}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="upgrade-modal__actions" style={{ marginTop: '20px' }}>
            <Button 
              type="submit" 
              variant="primary" 
              fullWidth 
              loading={loading}
              style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
            >
              Register & Upgrade
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
