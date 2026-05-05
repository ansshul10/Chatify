/**
 * Sidebar — Left panel showing all online users
 * Click any user to open a DM conversation
 */
import { useState } from 'react';
import { MessageSquare, Search, Settings, LogOut, Inbox, X, Users, Shield, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Avatar from '../ui/Avatar.jsx';
import useAuthStore from '../../store/authStore.js';
import useChatStore from '../../store/chatStore.js';
import useUIStore from '../../store/uiStore.js';
import useNotificationStore from '../../store/notificationStore.js';
import './layout.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const conversations = useChatStore((s) => s.conversations);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const isLoadingOnlineUsers = useChatStore((s) => s.isLoadingOnlineUsers);
  const createConversation = useChatStore((s) => s.createConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const activeConversation = useChatStore((s) => s.activeConversation);
  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const closeMobileSidebar = useUIStore((s) => s.closeMobileSidebar);
  const toggleInbox = useUIStore((s) => s.toggleInbox);
  const { unreadCount, unseenRequestsCount } = useNotificationStore();

  const [search, setSearch] = useState('');

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const filtered = onlineUsers.filter((u) => {
    if (!search) return true;
    const name = (u.displayName || u.username || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleUserClick = async (u) => {
    const isPrivate = u.preferences?.privacy?.isPrivate;
    const isFriend = user.friends?.some(f => (f._id || f) === u._id);

    if (isPrivate && !isFriend) {
      closeMobileSidebar();
      navigate(`/profile/${u._id}`);
      return;
    }

    const conv = await createConversation(u._id);
    if (conv) {
      setActiveConversation(conv);
      closeMobileSidebar();
      if (location.pathname !== '/chat') navigate('/chat');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get the other user in the active conversation for highlighting
  const activePeerId = activeConversation?.participants?.find(
    (p) => p.userId?._id !== user?._id
  )?.userId?._id;

  return (
    <>
      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeMobileSidebar} />
      )}
      <aside className={`sidebar ${mobileSidebarOpen ? 'sidebar--mobile-open' : ''} ${sidebarOpen ? '' : 'sidebar--closed'}`}>

        {/* Header */}
        <div className="sidebar__header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="sidebar__title" style={{ fontSize: 16, fontWeight: 600 }}>Users</span>
          </div>
          <button className="sidebar__close" onClick={() => {
            toggleSidebar();
            closeMobileSidebar();
          }} title="Close Sidebar">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="sidebar__search">
          <div className="sidebar__search-inner">
            <Search size={14} className="sidebar__search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sidebar__search-input"
            />
          </div>
        </div>

        {/* Online Users */}
        <div className="sidebar__section-header">
          <span>All Users</span>
          {onlineUsers.length > 0 && (
            <span className="sidebar__section-count">{onlineUsers.length}</span>
          )}
        </div>

        <div className="sidebar__users-list">
          {isLoadingOnlineUsers ? (
            <div className="sidebar__users-loading mono">Fetching users...</div>
          ) : filtered.length === 0 ? (
            <div className="sidebar__users-empty">
              <Users size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
              <div>{search ? 'No users found' : 'No users online'}</div>
            </div>
          ) : (
            filtered.map((u) => {
              const isActive = u._id === activePeerId;
              return (
                <div
                  key={u._id}
                  className={`sidebar__user-item ${isActive ? 'sidebar__user-item--active' : ''}`}
                  onClick={() => handleUserClick(u)}
                >
                  <Avatar
                    src={u.avatar}
                    name={u.displayName || u.username}
                    size={38}
                    online={u.onlineStatus || 'online'}
                  />
                  <div className="sidebar__user-item-info">
                    <div className="sidebar__user-item-name">
                      {u.displayName || u.username}
                    </div>
                    <span className={`sidebar__user-item-status ${u.onlineStatus === 'offline' ? 'sidebar__user-item-status--offline' : ''}`}>
                      {u.onlineStatus === 'offline' ? 'Offline' : 'Online'}
                    </span>                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer — current user */}
        <div className="sidebar__footer">
          <div className="sidebar__me" onClick={() => navigate('/profile')}>
            <Avatar
              src={user?.avatar}
              name={user?.displayName || user?.username}
              size={34}
              online={user?.preferences?.privacy?.showLastSeen === false ? 'offline' : 'online'}
            />
            <div className="sidebar__me-info">
              <div className="sidebar__me-name">
                {user?.displayName || user?.username || 'Anonymous'}
              </div>
              <div className="sidebar__me-role mono">
                {user?.isAnonymous ? 'Guest' : user?.role === 'admin' ? 'Admin' : 
                 (user?.preferences?.privacy?.showLastSeen === false ? 'Offline' : 'Online')}
              </div>
            </div>
          </div>
          <div className="sidebar__footer-actions">
            <button
              className="sidebar__footer-btn"
              onClick={() => navigate('/chat')}
              title="Chats"
            >
              <MessageSquare size={16} />
              <span>Chats</span>
            </button>
            <button
              className="sidebar__footer-btn"
              onClick={toggleInbox}
              title="Inbox"
              style={{ position: 'relative' }}
            >
              <Inbox size={16} />
              {totalUnread > 0 && user?.preferences?.notifications?.push !== false && (
                <span className="sidebar__footer-badge">{totalUnread}</span>
              )}
            </button>
            <button
              className="sidebar__footer-btn"
              onClick={() => navigate('/notifications')}
              title="Notifications"
              style={{ position: 'relative' }}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="sidebar__footer-badge">{unreadCount}</span>
              )}
            </button>
            <button
              className="sidebar__footer-btn"
              onClick={() => navigate('/friends')}
              title="Friends"
              style={{ position: 'relative' }}
            >
              <Users size={16} />
              {unseenRequestsCount > 0 && (
                <span className="sidebar__footer-badge">{unseenRequestsCount}</span>
              )}
            </button>
            {['admin', 'moderator'].includes(user?.role) && (
              <button
                className="sidebar__footer-btn"
                onClick={() => navigate('/admin')}
                title="Admin Panel"
                style={{ color: 'var(--accent-color)' }}
              >
                <Shield size={16} />
              </button>
            )}
            <button
              className="sidebar__footer-btn"
              onClick={() => navigate('/settings')}
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              className="sidebar__footer-btn sidebar__footer-btn--danger"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
