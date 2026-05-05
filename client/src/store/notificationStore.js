import { create } from 'zustand';
import api from '../services/api.js';

const useNotificationStore = create((set, get) => ({
  unreadCount: 0,
  unseenRequestsCount: 0,
  isLoading: false,

  fetchCounts: async () => {
    try {
      set({ isLoading: true });
      const [notifRes, friendRes] = await Promise.all([
        api.get('/notifications/unread-count'),
        api.get('/friends/requests/unseen-count')
      ]);

      if (notifRes.data.success) set({ unreadCount: notifRes.data.data.count });
      if (friendRes.data.success) set({ unseenRequestsCount: friendRes.data.data.count });
    } catch (err) {
      console.error('[NotificationStore] Failed to fetch counts:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  setUnreadCount: (count) => set({ unreadCount: count }),
  setUnseenRequestsCount: (count) => set({ unseenRequestsCount: count }),

  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  incrementUnseenRequests: () => set((state) => ({ unseenRequestsCount: state.unseenRequestsCount + 1 })),

  markNotificationsSeen: async () => {
    try {
      await api.patch('/notifications/mark-seen');
      set({ unreadCount: 0 }); // Or keep unread but clear badge?
      // Based on user request "seen krne pe hat jayenge", we clear the badge count.
      // But unread notifications still exist in the list.
      // Usually badges show UNREAD count. If we mark as SEEN, the badge disappears.
      set({ unreadCount: 0 }); 
    } catch (err) {
      console.error('[NotificationStore] Failed to mark notifications seen:', err);
    }
  },

  markRequestsSeen: async () => {
    try {
      await api.patch('/friends/requests/mark-seen');
      set({ unseenRequestsCount: 0 });
    } catch (err) {
      console.error('[NotificationStore] Failed to mark requests seen:', err);
    }
  }
}));

export default useNotificationStore;
