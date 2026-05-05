/**
 * RightSidebar — Advanced Inbox (Conversation List)
 */
import { useState } from 'react';
import { MessageSquare, Search, Clock, Check, CheckCheck, X, Trash2 } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import ConfirmationModal from '../chat/ConfirmationModal.jsx';
import useAuthStore from '../../store/authStore.js';
import useChatStore from '../../store/chatStore.js';
import { formatRelative } from '../../utils/formatTime.js';
import './layout.css';

export default function RightSidebar({ open, onClose }) {
  const user = useAuthStore((s) => s.user);
  const allConversations = useChatStore((s) => s.conversations);
  const activeConversation = useChatStore((s) => s.activeConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);

  const [deleteId, setDeleteId] = useState(null);

  // Filter locally to avoid infinite loop
  const conversations = allConversations.filter(
    (c) => c.lastMessage || c._id === activeConversation?._id
  );
  
  const handleSelect = (conv) => {
    setActiveConversation(conv);
    if (onClose) onClose();
  };

  const onConfirmDelete = async () => {
    if (deleteId) {
      await deleteConversation(deleteId);
      setDeleteId(null);
    }
  };

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <aside className={`right-sidebar ${open ? 'right-sidebar--open' : ''}`}>
      <div className="right-sidebar__header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="right-sidebar__title">Inbox</span>
          {totalUnread > 0 && user?.preferences?.notifications?.push !== false && (
            <div className="sidebar__section-count" style={{ marginLeft: 8, background: 'var(--danger)' }}>
              {totalUnread}
            </div>
          )}
        </div>
        <button className="right-sidebar__close" onClick={onClose} title="Close Inbox">
          <X size={18} />
        </button>
      </div>

      <div className="sidebar__search">
        <div className="sidebar__search-inner">
          <Search size={14} className="sidebar__search-icon" />
          <input
            type="text"
            placeholder="Search inbox..."
            className="sidebar__search-input"
          />
        </div>
      </div>

      <div className="sidebar__users-list">
        {conversations.length === 0 ? (
          <div className="right-sidebar__empty">
            <MessageSquare size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
            <p>Your inbox is empty</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const other = conv.participants?.find((p) => (p.userId?._id || p.userId)?.toString() !== user?._id)?.userId;
            const lastMsg = conv.lastMessage;
            const isActive = activeConversation?._id === conv._id;
            const isOnline = other?.isOnline;

            return (
              <div
                key={conv._id}
                className={`sidebar__user-item ${isActive ? 'sidebar__user-item--active' : ''}`}
                onClick={() => handleSelect(conv)}
                style={{ padding: '12px 16px', position: 'relative' }}
              >
                <div style={{ position: 'relative' }}>
                  <Avatar
                    src={other?.avatar}
                    name={other?.displayName || other?.username || 'User'}
                    size={42}
                    online={isOnline}
                  />
                  {conv.unreadCount > 0 && user?.preferences?.notifications?.push !== false && (
                    <span className="inbox-unread-badge">{conv.unreadCount}</span>
                  )}
                </div>

                <div className="sidebar__user-item-info" style={{ marginLeft: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="sidebar__user-item-name" style={{ fontWeight: conv.unreadCount > 0 ? '700' : '600' }}>
                      {other?.displayName || other?.username || 'Unknown'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {lastMsg && (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {formatRelative(lastMsg.createdAt)}
                        </span>
                      )}
                      <button 
                        className="inbox-item__delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(conv._id);
                        }}
                        title="Delete conversation"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    {lastMsg && lastMsg.senderId === user?._id && (
                      <span style={{ color: lastMsg.status === 'read' ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {lastMsg.status === 'read' ? <CheckCheck size={12} /> : <Check size={12} />}
                      </span>
                    )}
                    <span className="sidebar__user-item-status" style={{ 
                      color: conv.unreadCount > 0 ? 'var(--text)' : 'var(--text-secondary)',
                      fontWeight: conv.unreadCount > 0 ? '500' : '400',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block',
                      maxWidth: '160px'
                    }}>
                      {conv.isTyping ? (
                        <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Typing...</span>
                      ) : lastMsg ? (
                        lastMsg.content
                      ) : (
                        'No messages yet'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={onConfirmDelete}
        title="Delete Conversation"
        message="Are you sure you want to delete this chat? All messages will be permanently removed for you."
        confirmText="Delete Chat"
      />
    </aside>
  );
}
