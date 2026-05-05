/**
 * Toast notification — sharp, stacked bottom-right
 */
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import useUIStore from '../../store/uiStore.js';
import './ui.css';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

function ToastItem({ toast }) {
  const removeToast = useUIStore((s) => s.removeToast);
  const Icon = ICONS[toast.type] || Info;

  return (
    <div className={`toast toast--${toast.type || 'info'} slide-up`}>
      <Icon size={18} className="toast__icon" />
      <span className="toast__message">{toast.message}</span>
      <button className="toast__close" onClick={() => removeToast(toast.id)}>
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
