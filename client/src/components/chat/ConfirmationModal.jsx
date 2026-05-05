/**
 * ConfirmationModal — Generic modal for confirming actions
 */
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  variant = 'primary' 
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width={400}>
      <div className="delete-modal-content">
        <div className="delete-modal-text" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertTriangle size={20} color={variant === 'danger' ? 'var(--danger)' : 'var(--accent)'} style={{ flexShrink: 0 }} />
          <span>{message}</span>
        </div>
        
        <div className="delete-modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant={variant} 
            onClick={() => { onConfirm(); onClose(); }}
            style={variant === 'danger' ? { background: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
