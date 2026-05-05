/**
 * Chat Header — conversation info + actions (menu, inbox toggle)
 */
import { Search, MoreVertical, ArrowLeft, Lock, Inbox, User, Ban, Trash2, ShieldAlert, ShieldCheck, X, Clock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar.jsx';
import UpgradeModal from './UpgradeModal.jsx';
import ConfirmationModal from './ConfirmationModal.jsx';
import ReportModal from './ReportModal.jsx';
import useAuthStore from '../../store/authStore.js';
import useChatStore from '../../store/chatStore.js';
import Toast from '../ui/Toast.jsx';
import '../layout/layout.css';

export default function ChatHeader({ conversation, onMenuClick, onInfoClick }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [showMenu, setShowMenu] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingLoading, setIsSearchingLoading] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLoading(true);
      const results = await useChatStore.getState().searchMessages(searchQuery);
      setSearchResults(results || []);
      setIsSearchingLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!conversation) return null;

  const other = conversation.participants?.find(
    (p) => p.userId?._id !== user?._id
  );
  const otherUser = other?.userId || {};
  const isOnline = otherUser.isOnline;
  
  const isBlocked = user?.blockedUsers?.some(id => (id._id || id) === otherUser._id);

  const handleReport = async (reason) => {
    const success = await useChatStore.getState().reportUser(otherUser._id, reason);
    if (success) {
      alert('User reported successfully.'); // Or use Toast if available
    }
  };

  const handleBlockToggle = async () => {
    const success = isBlocked 
      ? await useChatStore.getState().unblockUser(otherUser._id)
      : await useChatStore.getState().blockUser(otherUser._id);
    
    if (success) {
      // Refresh local user state
      await useAuthStore.getState().init();
      
      // Update active conversation flags locally for immediate UI response
      const currentActive = useChatStore.getState().activeConversation;
      if (currentActive) {
        useChatStore.setState({
          activeConversation: {
            ...currentActive,
            iBlockedOther: !isBlocked
          }
        });
      }
    }
  };

  const handleDeleteChat = async () => {
    await useChatStore.getState().deleteConversation(conversation._id);
  };

  return (
    <div className="chat-header">
      {/* Mobile: open left sidebar */}
      <button className="chat-header__menu-btn" onClick={onMenuClick} title="Back to Users">
        <ArrowLeft size={20} />
      </button>

      <Avatar
        src={otherUser.avatar}
        name={otherUser.displayName || otherUser.username}
        size={36}
        online={isOnline}
      />

      <div className="chat-header__info">
        <div className="chat-header__name">
          {otherUser.displayName || otherUser.username || 'User'}
          {otherUser.isAnonymous && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 400 }}>
              (Anonymous)
            </span>
          )}
        </div>
        <div className={`chat-header__status ${isOnline ? 'chat-header__status--online' : ''}`}>
          {isOnline ? '● Online' : '○ Offline'}
          {conversation.isEncrypted && (
            <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>
              <Lock size={11} style={{ verticalAlign: 'middle' }} /> E2E
            </span>
          )}
        </div>
      </div>

      <div className="chat-header__actions">
        <div className="chat-header__search-container" ref={searchRef}>
          {isSearching ? (
            <div className="chat-header__search-input-wrapper slide-left">
              <input
                type="text"
                className="chat-header__search-input"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button className="chat-header__search-close" onClick={() => setIsSearching(false)}>
                <X size={14} />
              </button>
              
              {searchQuery && (
                <div className="chat-header__search-results slide-up">
                  {isSearchingLoading ? (
                    <div className="search-loading">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(msg => (
                      <div key={msg._id} className="search-result-item" onClick={() => { /* TODO: Scroll to message */ setIsSearching(false); }}>
                         <div className="search-result-header">
                            <span className="search-result-author">{msg.senderId?.username}</span>
                            <span className="search-result-time">{new Date(msg.createdAt).toLocaleDateString()}</span>
                         </div>
                         <p className="search-result-content truncate">{msg.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="search-no-results">No messages found</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button className="chat-header__action" title="Search messages" onClick={() => setIsSearching(true)}>
              <Search size={17} />
            </button>
          )}
        </div>
        <button
          className="chat-header__action chat-header__action--mobile-only"
          title="View Inbox"
          onClick={onInfoClick}
        >
          <Inbox size={17} />
        </button>

        <div className="dropdown" ref={menuRef}>
          <button
            className={`chat-header__action ${showMenu ? 'chat-header__action--active' : ''}`}
            title="More"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={17} />
          </button>

          {showMenu && (
            <div className="dropdown__menu slide-up">
              {user?.isAnonymous ? (
                <>
                  <button className="dropdown__item" onClick={() => { setShowMenu(false); setShowReportModal(true); }}>
                    <ShieldAlert size={14} /> Report User
                  </button>
                  <div className="dropdown__divider" />
                  <button 
                    className="dropdown__item dropdown__item--success" 
                    onClick={() => { setShowMenu(false); setShowUpgradeModal(true); }}
                    style={{ color: 'var(--success)', fontWeight: 600 }}
                  >
                    <ShieldCheck size={14} /> Register Now
                  </button>
                </>
              ) : (
                <>
                  {!otherUser.isAnonymous ? (
                    <button className="dropdown__item" onClick={() => { setShowMenu(false); navigate(`/profile/${otherUser._id}`); }}>
                      <User size={14} /> View Profile
                    </button>
                  ) : (
                    <div className="dropdown__item" style={{ opacity: 0.6, cursor: 'default' }}>
                      <User size={14} /> Anonymous Account
                    </div>
                  )}
                  <div className="dropdown__divider" />
                  <button className="dropdown__item" onClick={() => { setShowMenu(false); setShowReportModal(true); }}>
                    <ShieldAlert size={14} /> Report User
                  </button>
                  <button className="dropdown__item dropdown__item--danger" onClick={() => { setShowMenu(false); setShowBlockModal(true); }}>
                    <Ban size={14} /> {isBlocked ? 'Unblock User' : 'Block User'}
                  </button>
                  <div className="dropdown__divider" />
                  <button 
                    className={`dropdown__item ${conversation.isDisappearing ? 'dropdown__item--active' : ''}`}
                    onClick={async () => {
                      setShowMenu(false);
                      await api.patch(`/conversations/${conversation._id}/disappearing`, { duration: 86400 });
                    }}
                  >
                    <Clock size={14} /> {conversation.isDisappearing ? 'Disable Disappearing' : 'Enable Disappearing (24h)'}
                  </button>
                  <div className="dropdown__divider" />
                  <button className="dropdown__item dropdown__item--danger" onClick={() => { setShowMenu(false); setShowDeleteModal(true); }}>
                    <Trash2 size={14} /> Delete Chat
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReport={handleReport}
        userName={otherUser.displayName || otherUser.username}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteChat}
        title="Delete Conversation"
        message="Are you sure you want to delete this entire chat? This action cannot be undone."
        confirmText="Delete Everything"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleBlockToggle}
        title={isBlocked ? 'Unblock User' : 'Block User'}
        message={isBlocked ? `Are you sure you want to unblock ${otherUser.username}?` : `Are you sure you want to block ${otherUser.username}? They will no longer be able to message you.`}
        confirmText={isBlocked ? 'Unblock' : 'Block User'}
        variant={isBlocked ? 'primary' : 'danger'}
      />
    </div>
  );
}

