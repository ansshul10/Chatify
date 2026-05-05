/**
 * 404 Not Found page
 */
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import './notfound.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-page">
      <div className="notfound-card slide-up">
        <FileQuestion size={48} className="notfound-card__icon" />
        <h1 className="notfound-card__code mono">404</h1>
        <h2 className="notfound-card__title">Page not found</h2>
        <p className="notfound-card__desc">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Go Home
        </Button>
      </div>
    </div>
  );
}
