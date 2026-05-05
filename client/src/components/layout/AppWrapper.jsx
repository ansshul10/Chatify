/**
 * AppWrapper — Conditionally renders global components
 */
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import ToastContainer from '../ui/Toast.jsx';
import PrivacyBanner from '../ui/PrivacyBanner.jsx';
import AgreementModal from '../ui/AgreementModal.jsx';
import GlobalListeners from './GlobalListeners.jsx';
import { Info } from 'lucide-react';
import useUIStore from '../../store/uiStore.js';

export default function AppWrapper({ children }) {
  const location = useLocation();
  const hideFooter = ['/chat', '/settings', '/profile', '/admin', '/notifications'].some(path => location.pathname.startsWith(path));
  const { featureDisabled } = useUIStore();

  return (
    <div className="app-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <GlobalListeners />
      <Navbar />
      
      <div className="app-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>

      {!hideFooter && <Footer />}
      
      <ToastContainer />
      <PrivacyBanner />
      <AgreementModal />
    </div>
  );
}
