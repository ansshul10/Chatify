import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";

// General Pages
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ChatPage from "@/pages/Chat";
import Features from "@/pages/Features";
import Security from "@/pages/Security";
import Changelog from "@/pages/Changelog";
import Pricing from "@/pages/Pricing";
import Profile from "@/pages/Profile";
import Support from "@/pages/Support";

// Admin Main Page
import AdminDashboard from "@/pages/AdminDashboard";

// Admin Modular Sub-Pages (Located in pages/admin/)
import SubscriptionRequests from "@/pages/admin/SubscriptionRequests";
import CouponManager from "@/pages/admin/CouponManager";
import SystemSettings from "@/pages/admin/SystemSettings";
import SupportTickets from "@/pages/admin/SupportTickets"; // ← NEW
import UserManager from "@/pages/admin/UserManager";
import Announcements from "@/pages/admin/Announcements"; // ← NEW IMPORT
import NewsletterManager from "@/pages/admin/NewsletterManager";

// ── Protected Route Wrapper ───────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthContext();
  if (loading) return <LoadingSpinner />;
  return user ? children : <Navigate to="/login" replace />;
};

// ── Admin Route Wrapper ───────────────────────────────────────────────────────
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuthContext();
  if (loading) return <LoadingSpinner />;

  // Strict check: User must exist and have the 'admin' role
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

// ── Public Route Wrapper ──────────────────────────────────────────────────────
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuthContext();
  if (loading) return null;

  // If logged in, redirect away from login/register based on role
  if (user) {
    return user.role === "admin" ? <Navigate to="/admin" replace /> : <Navigate to="/chat" replace />;
  }

  return children;
};

// ── Loading Component ─────────────────────────────────────────────────────────
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#080b14]">
    <div className="flex flex-col items-center gap-4">
      <svg className="animate-spin w-10 h-10 text-primary-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-white/40 text-sm font-medium">Loading session...</p>
    </div>
  </div>
);

const router = createBrowserRouter([
  // Public Routes
  { path: "/", element: <LandingPage /> },
  { path: "/features", element: <Features /> },
  { path: "/security", element: <Security /> },
  { path: "/changelog", element: <Changelog /> },
  { path: "/pricing", element: <Pricing /> },

  // Auth Routes
  {
    path: "/login",
    element: <PublicRoute><Login /></PublicRoute>,
  },
  {
    path: "/register",
    element: <PublicRoute><Register /></PublicRoute>,
  },

  // Protected User Routes
  {
    path: "/chat",
    element: <ProtectedRoute><ChatPage /></ProtectedRoute>,
  },

  {
    path: "/profile",
    element: <ProtectedRoute><Profile /></ProtectedRoute>,
  },

  {
    path: "/support",
    element: <ProtectedRoute><Support /></ProtectedRoute>
  }, // ← NEW

  // ── Admin Modular Routes ─────────────────────────────────────────────────────
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/subscriptions",
    element: (
      <AdminRoute>
        <SubscriptionRequests />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/coupons",
    element: (
      <AdminRoute>
        <CouponManager />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/settings",
    element: (
      <AdminRoute>
        <SystemSettings />
      </AdminRoute>
    ),
  },

  {
    path: "/admin/support",
    element: (
      <AdminRoute>
        <SupportTickets />
      </AdminRoute>
    ),
  }, // ← NEW


  {
    path: "/admin/announcements", // ← NEW ROUTE
    element: (
      <AdminRoute>
        <Announcements />
      </AdminRoute>
    ),
  },

  {
    path: "/admin/users",
    element: (
      <AdminRoute><UserManager />
      </AdminRoute>
    ),
  },

  {
    path: "/admin/newsletter",
    element: (
      <AdminRoute><NewsletterManager />
      </AdminRoute>
    ),
  },

  // Fallback Route
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default router;