/**
 * Chat store — conversations, messages, typing, online users
 * Aligned with server socket events and API responses.
 */
import { create } from 'zustand';
import api from '../services/api.js';
import { getSocket } from '../services/socket.js';

const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  typingUsers: {},
  onlineUsers: [],
  hasMore: true,
  isLoadingConversations: false,
  isLoadingMessages: false,
  isLoadingOnlineUsers: false,
  replyTo: null,
  editingMessage: null,

  // Fetch conversation list — server returns paginated { data: [...], meta }
  fetchConversations: async () => {
    try {
      set({ isLoadingConversations: true });
      const { data } = await api.get('/conversations');
      if (data.success) {
        set({ conversations: data.data || [] });
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  // Fetch ALL online users (not just friends) via /users/online
  fetchOnlineUsers: async () => {
    try {
      set({ isLoadingOnlineUsers: true });
      const { data } = await api.get('/users/online');
      if (data.success) {
        set({ onlineUsers: data.data?.users || [] });
      }
    } catch {
      // Non-critical — silently fail
    } finally {
      set({ isLoadingOnlineUsers: false });
    }
  },

  // Update user presence in online list
  setUserOnline: (userId) => {
    set((state) => ({
      onlineUsers: state.onlineUsers.map((u) =>
        u._id === userId ? { ...u, isOnline: true, onlineStatus: 'online' } : u
      ),
    }));
  },

  setUserOffline: (userId) => {
    set((state) => ({
      onlineUsers: state.onlineUsers.map((u) =>
        u._id === userId ? { ...u, isOnline: false, onlineStatus: 'offline' } : u
      ),
    }));
  },

  // Set active conversation
  setActiveConversation: (conv) => {
    set({ activeConversation: conv, messages: [], hasMore: true, replyTo: null });
    if (conv) {
      // Clear unread count locally for immediate UI feedback
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c._id === conv._id ? { ...c, unreadCount: 0 } : c
        ),
      }));
      get().fetchMessages(conv._id);
      const socket = getSocket();
      if (socket) {
        socket.emit('conversation:open', { conversationId: conv._id });
      }
    }
  },

  // Fetch messages for a conversation
  fetchMessages: async (convId, cursor) => {
    try {
      set({ isLoadingMessages: true });
      const params = { limit: 30 };
      if (cursor) params.cursor = cursor;
      const { data } = await api.get(`/messages/conversation/${convId}`, { params });
      if (data.success) {
        const newMsgs = data.data || [];
        set((state) => ({
          messages: cursor ? [...newMsgs, ...state.messages] : newMsgs,
          hasMore: data.meta?.pagination?.hasMore ?? false,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  // Send message — server expects { conversationId, content, clientId, ... }
  sendMessage: async (content, options = {}) => {
    const conv = get().activeConversation;
    if (!conv) return;

    const socket = getSocket();
    if (socket) {
      const clientId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      socket.emit('message:send', {
        conversationId: conv._id,
        content,
        clientId,
        isEncrypted: options.isEncrypted || false,
        replyTo: options.replyTo || null,
        selfDestructMinutes: options.selfDestructMinutes || null,
      });
    }
    set({ replyTo: null });
  },

  // Edit message
  editMessage: async (messageId, content, options = {}) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('message:edit', {
        messageId,
        content,
        isEncrypted: options.isEncrypted || false,
      });
    }
    set({ editingMessage: null });
  },

  // React to message
  reactToMessage: (messageId, emoji) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('message:react', { messageId, emoji });
    }
  },

  // Toggle bookmark
  toggleBookmark: async (messageId) => {
    try {
      const { data } = await api.post(`/messages/${messageId}/bookmark`);
      if (data.success) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === messageId ? { ...m, isBookmarked: data.data.bookmarked } : m
          ),
        }));
        return true;
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
    return false;
  },

  // Search messages
  searchMessages: async (query) => {
    try {
      const { data } = await api.get('/messages/search', { params: { q: query } });
      return data.success ? data.data.messages : [];
    } catch (err) {
      console.error('Search failed:', err);
      return [];
    }
  },

  // Add message (from socket)
  addMessage: (msg) => {
    set((state) => {
      const exists = state.messages.some((m) => m._id === msg._id);
      if (exists) return state;
      return { messages: [...state.messages, msg] };
    });
    // Update conversation last message and move to top
    set((state) => {
      const convId = msg.conversationId || msg.target;
      const isActive = state.activeConversation?._id === convId;
      const exists = state.conversations.find((c) => c._id === convId);
      
      if (!exists) return state; // conversation:updated will handle new ones

      return {
        conversations: [
          { 
            ...exists, 
            lastMessage: msg, 
            updatedAt: msg.createdAt,
            unreadCount: isActive ? 0 : (exists.unreadCount || 0)
          },
          ...state.conversations.filter((c) => c._id !== convId),
        ],
      };
    });
  },

  // Update conversation (from socket or API)
  updateConversation: (conv) => {
    set((state) => {
      const exists = state.conversations.find((c) => c._id === conv._id);
      let newConversations;
      
      if (exists) {
        // Move to top and update
        newConversations = [
          { ...exists, ...conv },
          ...state.conversations.filter((c) => c._id !== conv._id),
        ];
      } else {
        // Add to top
        newConversations = [conv, ...state.conversations];
      }

      return {
        conversations: newConversations,
        activeConversation:
          state.activeConversation?._id === conv._id
            ? { ...state.activeConversation, ...conv }
            : state.activeConversation,
      };
    });
  },

  // Update message (edited)
  updateMessage: (msg) => {
    set((state) => ({
      messages: state.messages.map((m) => (m._id === msg._id ? { ...m, ...msg } : m)),
    }));
  },

  // Mark message as read
  markMessageAsRead: ({ messageId, readAt }) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, status: 'read', readAt } : m
      ),
    }));
  },

  // Mark message as delivered
  markMessageAsDelivered: ({ messageId, deliveredAt }) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, status: 'delivered', deliveredAt } : m
      ),
    }));
  },

  // Delete message
  deleteMessage: (messageId) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('message:delete', { messageId });
    }
  },

  // Remove message (from socket or locally)
  removeMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, isDeleted: true, content: '[deleted]' } : m
      ),
    }));
  },

  // Typing — store per-conversation typing user IDs
  setTyping: (conversationId, userId, isTyping) => {
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      let updated;
      if (isTyping) {
        updated = current.includes(userId) ? current : [...current, userId];
      } else {
        updated = current.filter((id) => id !== userId);
      }
      return { typingUsers: { ...state.typingUsers, [conversationId]: updated } };
    });
  },

  // Reply
  setReplyTo: (msg) => set({ replyTo: msg, editingMessage: null }),
  clearReplyTo: () => set({ replyTo: null }),

  // Edit
  setEditingMessage: (msg) => set({ editingMessage: msg, replyTo: null }),
  clearEditingMessage: () => set({ editingMessage: null }),

  // Delete conversation
  deleteConversation: async (convId) => {
    try {
      const { data } = await api.delete(`/conversations/${convId}`);
      if (data.success) {
        set((state) => ({
          conversations: state.conversations.filter((c) => c._id !== convId),
          activeConversation: state.activeConversation?._id === convId ? null : state.activeConversation,
          messages: state.activeConversation?._id === convId ? [] : state.messages,
        }));
        return true;
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
    return false;
  },

  // Block user
  blockUser: async (userId) => {
    try {
      const { data } = await api.post(`/users/me/block/${userId}`);
      if (data.success) {
        return true;
      }
    } catch (err) {
      console.error('Failed to block user:', err);
    }
    return false;
  },

  // Unblock user
  unblockUser: async (userId) => {
    try {
      const { data } = await api.delete(`/users/me/block/${userId}`);
      return data.success;
    } catch (err) {
      console.error('Failed to unblock user:', err);
      return false;
    }
  },

  // Report user
  reportUser: async (userId, reason) => {
    try {
      const { data } = await api.post(`/users/${userId}/report`, { reason });
      return data.success;
    } catch (err) {
      console.error('Failed to report user:', err);
      return false;
    }
  },

  // Create new conversation (DM) — server returns { data: { conversation } }
  createConversation: async (userId) => {
    try {
      const { data } = await api.post('/conversations', { userId });
      if (data.success) {
        const conv = data.data?.conversation || data.data;
        set((state) => {
          const exists = state.conversations.some((c) => c._id === conv._id);
          if (exists) return state;
          return { conversations: [conv, ...state.conversations] };
        });
        return conv;
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
      return null;
    }
  },
}));

export default useChatStore;
