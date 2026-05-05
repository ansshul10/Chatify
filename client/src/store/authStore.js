/**
 * Auth store — Zustand
 * Aligned with server API: { success, data: { user, accessToken } }
 * Login uses `identifier` field (not `email`).
 * /auth/me returns { data: { user } }.
 */
import { create } from 'zustand';
import api from '../services/api.js';
import { connectSocket, disconnectSocket } from '../services/socket.js';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Initialize — check if user is logged in
  init: async () => {
    try {
      set({ isLoading: true });
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { data } = await api.get('/auth/me');
      if (data.success && data.data?.user) {
        set({ user: data.data.user, isAuthenticated: true });
        connectSocket(token);
      }
    } catch {
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  // Register
  register: async (email, username, password) => {
    try {
      set({ error: null });
      const { data } = await api.post('/auth/register', { email, username, password });
      if (data.success) {
        const { accessToken, user } = data.data;
        localStorage.setItem('accessToken', accessToken);
        set({ user, isAuthenticated: true });
        connectSocket(accessToken);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed';
      set({ error: msg });
      return { success: false, error: msg };
    }
  },

  // Login — server expects { identifier, password }
  login: async (identifier, password, totpCode) => {
    try {
      set({ error: null });
      const payload = { identifier, password };
      if (totpCode) payload.totpCode = totpCode;
      const { data } = await api.post('/auth/login', payload);
      if (data.success) {
        // 2FA required check
        if (data.data.require2FA) {
          return { success: false, requires2FA: true, tempToken: data.data.tempToken };
        }
        const { accessToken, user } = data.data;
        localStorage.setItem('accessToken', accessToken);
        set({ user, isAuthenticated: true });
        connectSocket(accessToken);
        return { success: true, requires2FA: false };
      }
    } catch (err) {
      const errData = err.response?.data?.error;
      const msg = errData?.message || 'Login failed';
      set({ error: msg });
      return { success: false, error: msg };
    }
  },

  // Anonymous login
  loginAnonymous: async () => {
    try {
      set({ error: null });
      const { data } = await api.post('/auth/anonymous');
      if (data.success) {
        const { accessToken, user } = data.data;
        localStorage.setItem('accessToken', accessToken);
        set({ user, isAuthenticated: true });
        connectSocket(accessToken);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Anonymous login failed';
      set({ error: msg });
      return { success: false, error: msg };
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    disconnectSocket();
    set({ user: null, isAuthenticated: false, error: null });
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      return { success: data.success };
    } catch (err) {
      return { success: false, error: err.response?.data?.error?.message || 'Failed' };
    }
  },

  // Reset password
  resetPassword: async (token, password) => {
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      return { success: data.success };
    } catch (err) {
      return { success: false, error: err.response?.data?.error?.message || 'Failed' };
    }
  },

  // Verify email
  verifyEmail: async (token) => {
    try {
      const { data } = await api.post('/auth/verify-email', { token });
      return { success: data.success };
    } catch (err) {
      return { success: false, error: err.response?.data?.error?.message || 'Failed' };
    }
  },

  // Upgrade anon -> registered
  upgrade: async (email, username, password) => {
    try {
      set({ error: null });
      const { data } = await api.post('/auth/upgrade', { email, username, password });
      if (data.success) {
        const { accessToken, user } = data.data;
        localStorage.setItem('accessToken', accessToken);
        set({ user, isAuthenticated: true });
        // No need to reconnect socket, same user ID
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Upgrade failed';
      set({ error: msg });
      return { success: false, error: msg };
    }
  },

  // Update user in state
  setUser: (user) => set({ user }),
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
