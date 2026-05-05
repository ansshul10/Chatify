import { useState, useEffect } from 'react';
import { ShieldCheck, Check, ChevronRight, Scale, Lock, Heart, ShieldAlert } from 'lucide-react';
import Button from './Button.jsx';
import './agreement-modal.css';

export default function AgreementModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [agreedPoints, setAgreedPoints] = useState([false, false, false, false]);

  useEffect(() => {
    const agreed = localStorage.getItem('chatify_agreement_accepted');
    if (!agreed) {
      setIsVisible(true);
    }
  }, []);

  const handleTogglePoint = (index) => {
    const newPoints = [...agreedPoints];
    newPoints[index] = !newPoints[index];
    setAgreedPoints(newPoints);
  };

  const handleAgree = () => {
    if (agreedPoints.every(p => p)) {
      localStorage.setItem('chatify_agreement_accepted', 'true');
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  const points = [
    { 
      title: "Age Verification", 
      desc: "I am at least 18 years old." 
    },
    { 
      title: "Terms of Use", 
      desc: "I agree to the Chatify Terms of Use." 
    },
    { 
      title: "Privacy Policy", 
      desc: "I have read and agree to the Privacy Policy." 
    },
    { 
      title: "Safety & Community", 
      desc: "I agree to follow safety guidelines." 
    }
  ];

  return (
    <div className="agreement-overlay">
      <div className="agreement-modal">
        <div className="agreement-modal__glow" />
        
        <div className="agreement-modal__content">
          <div className="agreement-modal__header">
            <div className="agreement-modal__icon-box">
              <ShieldCheck size={32} />
            </div>
            <h2 className="agreement-modal__title">Privacy & Terms</h2>
            <p className="agreement-modal__subtitle">
              Please review and accept our guidelines to continue your journey on Chatify.
            </p>
          </div>

          <div className="agreement-modal__body">
            <div className="agreement-checklist">
              {points.map((point, i) => (
                <div 
                  key={i} 
                  className={`agreement-item ${agreedPoints[i] ? 'agreement-item--checked' : ''}`}
                  onClick={() => handleTogglePoint(i)}
                >
                  <div className="agreement-item__checkbox">
                    {agreedPoints[i] && <Check size={14} strokeWidth={3} />}
                  </div>
                  <div className="agreement-item__text">
                    <span className="agreement-item__title">{point.title}</span>
                    <span className="agreement-item__desc">{point.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="agreement-modal__footer">
            <p className="agreement-modal__footer-text">
              By clicking "Enter Chatify", you confirm that you have read and agreed to all the points above.
            </p>
            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              onClick={handleAgree}
              disabled={!agreedPoints.every(p => p)}
              className="agreement-enter-btn"
            >
              <span>Enter Chatify</span>
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
