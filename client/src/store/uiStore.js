/**
 * UI store — theme, sidebar, modals
 */
import { create } from 'zustand';
import api from '../services/api';

const getInitialTheme = () => {
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const useUIStore = create((set) => ({
  theme: getInitialTheme(),
  sidebarOpen: true,
  mobileSidebarOpen: false,
  inboxOpen: false,
  activeModal: null,
  modalData: null,
  featureDisabled: null, // { name: string, message: string }
  config: {
    flags: {},
    version: '',
    maintenance: false
  },
  toasts: [],

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return { theme: next };
    }),

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (val) => set({ sidebarOpen: val }),
  toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),

  toggleInbox: () => set((s) => ({ inboxOpen: !s.inboxOpen })),
  openInbox: () => set({ inboxOpen: true }),
  closeInbox: () => set({ inboxOpen: false }),

  openModal: (name, data = null) => set({ activeModal: name, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  setFeatureDisabled: (data) => set({ featureDisabled: data }),

  fetchConfig: async () => {
    try {
      const { data } = await api.get('/system/config');
      if (data.success) {
        set({ config: data.data });
      }
    } catch (err) {
      console.error('[UI] Failed to fetch system config:', err.message);
    }
  },

  isFeatureEnabled: (flag) => {
    const { config } = useUIStore.getState();
    if (!config.flags || Object.keys(config.flags).length === 0) {
      // Default to true for core features while loading
      if (['FEATURE_ANONYMOUS_CHAT', 'FEATURE_2FA'].includes(flag)) return true;
      return false;
    }
    return !!config.flags?.[flag];
  },

  addToast: (toast) => {
    const id = Date.now() + Math.random();
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id }],
    }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, toast.duration || 4000);
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export default useUIStore;
