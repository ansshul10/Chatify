/**
 * ReportModal — Modal for entering report reason
 */
import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { ShieldAlert } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, onReport, userName }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setLoading(true);
    await onReport(reason);
    setLoading(false);
    setReason('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Report ${userName}`} width={450}>
      <form className="upgrade-modal__form" onSubmit={handleSubmit}>
        <div className="upgrade-modal__header" style={{ marginBottom: '10px' }}>
          <ShieldAlert size={32} color="var(--danger)" />
          <p>Please describe why you are reporting this user. Our team will review your report shortly.</p>
        </div>

        <div className="input-group">
          <label className="input-label">Reason for reporting</label>
          <textarea
            className="input"
            style={{ minHeight: '100px', padding: '12px', resize: 'none' }}
            placeholder="e.g. Inappropriate behavior, harassment, spam..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="delete-modal-actions">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            loading={loading}
            disabled={!reason.trim()}
            style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
          >
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
