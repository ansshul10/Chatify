/**
 * App — React Router v6 with auth-guarded routes
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore.js';
import useUIStore from './store/uiStore.js';
import ToastContainer from './components/ui/Toast.jsx';

// Pages
import Landing from './pages/public/Landing.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import Chat from './pages/chat/Chat.jsx';
import Profile from './pages/user/Profile.jsx';
import Settings from './pages/user/Settings.jsx';
import Friends from './pages/user/Friends.jsx';
import Notifications from './pages/user/Notifications.jsx';
import Features from './pages/product/Features.jsx';
import Explore from './pages/product/Explore.jsx';
import Security from './pages/product/Security.jsx';
import Updates from './pages/product/Updates.jsx';
import Privacy from './pages/compliance/Privacy.jsx';
import Terms from './pages/compliance/Terms.jsx';
import Cookies from './pages/compliance/Cookies.jsx';
import Compliance from './pages/compliance/Compliance.jsx';
import Documentation from './pages/resources/Documentation.jsx';
import HelpCenter from './pages/resources/HelpCenter.jsx';
import Blog from './pages/resources/Blog.jsx';
import CommunityHub from './pages/resources/CommunityHub.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import NotFound from './pages/public/NotFound.jsx';

// Auth guard
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div className="page-loading" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mono" style={{ color: 'var(--text-muted)' }}>Loading...</span>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Guest guard (redirect if already logged in)
function GuestRoute({ children }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (isAuthenticated) {
    return ['admin', 'moderator'].includes(user?.role) ? <Navigate to="/admin" replace /> : <Navigate to="/chat" replace />;
  }
  return children;
}

// Admin guard
function AdminRoute({ children }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!isAuthenticated || !['admin', 'moderator'].includes(user?.role)) {
    return <Navigate to="/chat" replace />;
  }
  return children;
}

import AppWrapper from './components/layout/AppWrapper.jsx';

export default function App() {
  const init = useAuthStore((s) => s.init);
  const fetchConfig = useUIStore((s) => s.fetchConfig);
  const theme = useUIStore((s) => s.theme);

  // Initialize auth & config on mount
  useEffect(() => {
    init();
    fetchConfig();
  }, [init, fetchConfig]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <AppWrapper>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/features" element={<Features />} />
          <Route path="/security" element={<Security />} />
          <Route path="/updates" element={<Updates />} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/legal" element={<Compliance />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/community" element={<CommunityHub />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected */}
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppWrapper>
    </BrowserRouter>
  );
}
