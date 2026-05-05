import { useEffect } from 'react';
import useAuthStore from '../../store/authStore.js';
import useChatStore from '../../store/chatStore.js';
import { getSocket } from '../../services/socket.js';
import api from '../../services/api.js';
import { playPing } from '../../utils/sounds.js';
import useNotificationStore from '../../store/notificationStore.js';

export default function GlobalListeners() {
  const { isAuthenticated, user } = useAuthStore();
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const fetchOnlineUsers = useChatStore((s) => s.fetchOnlineUsers);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const removeMessage = useChatStore((s) => s.removeMessage);
  const updateConversation = useChatStore((s) => s.updateConversation);
  const setTyping = useChatStore((s) => s.setTyping);
  const { fetchCounts, setUnreadCount, incrementUnread, setUnseenRequestsCount, incrementUnseenRequests } = useNotificationStore();

  // Fetch conversations + online users on mount (if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      fetchOnlineUsers();
      fetchCounts();
    }
  }, [isAuthenticated, fetchConversations, fetchOnlineUsers, fetchCounts]);

  // Socket listeners
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    if (!socket) return;

    const onNewMessage = (msg) => {
      addMessage(msg);
      // Play sound if message is from someone else
      const myId = user?._id?.toString();
      const senderId = (msg.senderId?._id || msg.senderId)?.toString();
      if (senderId && senderId !== myId) {
        playPing(user);
      }
    };
    const onMsgUpdated = (msg) => updateMessage(msg);
    const onMsgDeleted = ({ messageId }) => removeMessage(messageId);
    const onConvUpdated = (conv) => updateConversation(conv);
    
    const onNotifNew = (notif) => {
      incrementUnread();
    };
    const onNotifCount = ({ count }) => {
      setUnreadCount(count);
    };
    const onFriendRequest = () => {
      incrementUnseenRequests();
    };
    const onFriendRequestCancelled = () => {
      fetchCounts();
    };
    const onFriendRequestCount = ({ count }) => {
      setUnseenRequestsCount(count);
    };

    const onTyping = ({ conversationId, userId: tid, isTyping }) => {
      if (tid !== user?._id) setTyping(conversationId, tid, isTyping);
    };

    const onMsgReaction = ({ messageId, reactions }) => {
      updateMessage({ _id: messageId, reactions });
    };

    // Presence — add new user to list
    const onPresenceOnline = async ({ userId: uid, status: receivedStatus }) => {
      if (uid === user?._id) return;
      
      try {
        const { data } = await api.get(`/users/${uid}`);
        if (data.success && data.data?.user) {
          useChatStore.setState((s) => {
            const exists = s.onlineUsers.some((u) => u._id === uid);
            if (exists) {
              return {
                onlineUsers: s.onlineUsers.map((u) => 
                  u._id === uid ? { ...u, isOnline: true, onlineStatus: receivedStatus || 'online' } : u
                ),
              };
            }
            return {
              onlineUsers: [...s.onlineUsers, { 
                ...data.data.user, 
                isOnline: true, 
                onlineStatus: receivedStatus || 'online' 
              }],
            };
          });
        }
      } catch { /* ignore */ }
    };

    // Presence — remove offline user from list
    const onPresenceOffline = ({ userId: uid }) => {
      useChatStore.setState((s) => ({
        onlineUsers: s.onlineUsers.filter((u) => u._id !== uid),
      }));
    };

    const onPresenceUpdate = ({ userId: uid, status }) => {
      if (status === 'online' || status === 'offline') onPresenceOnline({ userId: uid, status });
      else onPresenceOffline({ userId: uid });
    };

    const onMsgRead = (data) => useChatStore.getState().markMessageAsRead(data);
    const onMsgDelivered = (data) => useChatStore.getState().markMessageAsDelivered(data);

    socket.on('message:new', onNewMessage);
    socket.on('message:updated', onMsgUpdated);
    socket.on('message:deleted', onMsgDeleted);
    socket.on('message:read', onMsgRead);
    socket.on('message:delivered', onMsgDelivered);
    socket.on('message:reaction', onMsgReaction);
    socket.on('typing:update', onTyping);
    socket.on('presence:online', onPresenceOnline);
    socket.on('presence:update', onPresenceUpdate);
    socket.on('conversation:updated', onConvUpdated);
    socket.on('notification:new', onNotifNew);
    socket.on('notification:count_update', onNotifCount);
    socket.on('friend:request', onFriendRequest);
    socket.on('friend:request_cancelled', onFriendRequestCancelled);
    socket.on('friend:request_count_update', onFriendRequestCount);

    socket.on('user:block_update', ({ blockerId, blockedId, isBlocked }) => {
      // 1. Refresh global user state (important for blockedUsers array)
      useAuthStore.getState().init();

      // 2. Refresh conversation list
      fetchConversations();

      const currentActive = useChatStore.getState().activeConversation;
      if (currentActive) {
        const participants = currentActive.participants;
        const isAffected = participants.some(p => {
          const pid = (p.userId?._id || p.userId)?.toString();
          return pid === blockerId?.toString() || pid === blockedId?.toString();
        });

        if (isAffected) {
          api.get(`/conversations/${currentActive._id}`).then(({ data }) => {
            if (data.success) {
              useChatStore.setState({ activeConversation: data.data.conversation || data.data });
            }
          });
        }
      }
    });

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('message:updated', onMsgUpdated);
      socket.off('message:deleted', onMsgDeleted);
      socket.off('message:read', onMsgRead);
      socket.off('message:delivered', onMsgDelivered);
      socket.off('message:reaction', onMsgReaction);
      socket.off('typing:update', onTyping);
      socket.off('presence:online', onPresenceOnline);
      socket.off('presence:offline', onPresenceOffline);
      socket.off('presence:update', onPresenceUpdate);
      socket.off('conversation:updated', onConvUpdated);
      socket.off('notification:new', onNotifNew);
      socket.off('notification:count_update', onNotifCount);
      socket.off('friend:request', onFriendRequest);
      socket.off('friend:request_cancelled', onFriendRequestCancelled);
      socket.off('friend:request_count_update', onFriendRequestCount);
      socket.off('user:block_update');
    };
  }, [isAuthenticated, addMessage, updateMessage, removeMessage, updateConversation, setTyping, fetchConversations, user?._id]);

  return null;
}
