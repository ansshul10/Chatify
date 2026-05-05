/**
 * Chat page — 3-column layout:
 * Left: Sidebar (online users) | Center: Messages | Right: Conversation info
 */
import { useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import RightSidebar from '../../components/layout/RightSidebar.jsx';
import ChatHeader from '../../components/chat/ChatHeader.jsx';
import MessageList from '../../components/chat/MessageList.jsx';
import MessageInput from '../../components/chat/MessageInput.jsx';
import useChatStore from '../../store/chatStore.js';
import useAuthStore from '../../store/authStore.js';
import useUIStore from '../../store/uiStore.js';
import { getSocket } from '../../services/socket.js';
import api from '../../services/api.js';
import { MessageSquare, Users, ArrowLeft, ShieldAlert, Lock, EyeOff, Zap, Inbox } from 'lucide-react';
import './chat.css';

export default function Chat() {
  const activeConversation = useChatStore((s) => s.activeConversation);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const fetchOnlineUsers = useChatStore((s) => s.fetchOnlineUsers);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const removeMessage = useChatStore((s) => s.removeMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const user = useAuthStore((s) => s.user);
  const openMobileSidebar = useUIStore((s) => s.openMobileSidebar);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const updateConversation = useChatStore((s) => s.updateConversation);


  const [encryptionKey, setEncryptionKey] = useState('');
  const [isEncryptionOn, setIsEncryptionOn] = useState(false);

  const inboxOpen = useUIStore((s) => s.inboxOpen);
  const setInboxOpen = useUIStore((s) => s.setInboxOpen || s.openInbox);
  const closeInbox = useUIStore((s) => s.closeInbox);

  const totalUnread = useChatStore((s) => s.conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0));



  const handleToggleEncryption = (newKey) => {
    if (newKey) {
      setEncryptionKey(newKey);
      setIsEncryptionOn(true);
    } else if (!encryptionKey && !isEncryptionOn) {
      // This case is now handled by the modal in MessageInput
      return;
    } else {
      setIsEncryptionOn((v) => !v);
    }
  };

  const accentColor = user?.preferences?.accentColor;
  const chatBackground = user?.preferences?.chatBackground;

  const backgroundMap = {
    'Obsidian Blue': { 
      bg: '#0F172A', 
      text: '#F8FAFC', 
      secondary: '#94A3B8', 
      border: '#1E293B', 
      bubble: '#1E293B',
      isLight: false 
    },
    'Deep Emerald': { 
      bg: '#022C22', 
      text: '#F8FAFC', 
      secondary: '#D1FAE5', 
      border: '#064E3B', 
      bubble: '#064E3B',
      isLight: false 
    },
    'Royal Crimson': { 
      bg: '#450A0A', 
      text: '#F8FAFC', 
      secondary: '#FEE2E2', 
      border: '#7F1D1D', 
      bubble: '#7F1D1D',
      isLight: false 
    },
  };

  const customStyles = {};
  if (accentColor) {
    customStyles['--accent'] = accentColor;
    if (accentColor.startsWith('#') && accentColor.length === 7) {
      const r = parseInt(accentColor.slice(1, 3), 16);
      const g = parseInt(accentColor.slice(3, 5), 16);
      const b = parseInt(accentColor.slice(5, 7), 16);
      customStyles['--accent-rgb'] = `${r}, ${g}, ${b}`;
    }
  }

  if (chatBackground && chatBackground !== 'Default' && backgroundMap[chatBackground]) {
    const theme = backgroundMap[chatBackground];
    customStyles['--chat-bg'] = theme.bg;
    customStyles['--chat-text'] = theme.text;
    customStyles['--chat-secondary'] = theme.secondary;
    customStyles['--chat-border'] = theme.border;
    customStyles['--chat-bubble'] = theme.bubble;
    customStyles['--chat-is-light'] = theme.isLight ? '1' : '0';
    
    // For premium feel, adjust the sender color and meta text
    if (theme.isLight) {
      customStyles['--chat-sender'] = 'var(--accent)';
      customStyles['--chat-meta'] = theme.secondary;
    } else {
      customStyles['--chat-sender'] = '#FFFFFF';
      customStyles['--chat-meta'] = 'rgba(255, 255, 255, 0.6)';
    }
  }

  return (
    <div className="app-layout" style={customStyles}>
      {/* Left: Online Users */}
      <Sidebar />

      {/* Center: Chat */}
      <main className="app-main" style={{ backgroundColor: 'var(--chat-bg)' }}>
        {activeConversation ? (
          <>
            <ChatHeader
              conversation={activeConversation}
              onMenuClick={() => {
                setSidebarOpen(true);
                openMobileSidebar();
              }}
              onInfoClick={() => setInboxOpen((v) => !v)}
            />
            <MessageList encryptionKey={encryptionKey} />
            <MessageInput
              encryptionKey={encryptionKey}
              isEncryptionOn={isEncryptionOn}
              onToggleEncryption={handleToggleEncryption}
            />
          </>
        ) : (
          <div className="chat-empty">
            <button
              className="chat-empty__menu-btn"
              onClick={() => {
                setSidebarOpen(true);
                openMobileSidebar();
              }}
              title="View Users"
            >
              <Users size={20} />
              <span>Users</span>
            </button>
            <button
              className="chat-empty__inbox-btn"
              onClick={() => setInboxOpen(true)}
              title="View Inbox"
            >
              <Inbox size={20} />
              <span>Inbox</span>
              {totalUnread > 0 && user?.preferences?.notifications?.push !== false && (
                <span className="chat-empty__badge">{totalUnread}</span>
              )}
            </button>
            <div className="chat-empty__content">
              <div className="chat-empty__header">
                <h2 className="chat-empty__title">Welcome to Chatify</h2>
                <p className="chat-empty__desc">
                  The next generation of secure, private messaging is here.
                </p>
              </div>

              <div className="chat-empty__warning">
                <div className="chat-empty__warning-icon">
                  <ShieldAlert size={20} />
                </div>
                <div className="chat-empty__warning-text">
                  <strong>Security Advisory:</strong> Never share sensitive personal information, passwords, or recovery keys with anyone. Chatify will never ask for your private keys.
                </div>
              </div>

              <div className="chat-empty__tips">
                <div className="chat-empty__tip">
                  <Lock size={18} />
                  <span>E2EE Active by default</span>
                </div>
                <div className="chat-empty__tip">
                  <EyeOff size={18} />
                  <span>Zero tracking or logging</span>
                </div>
                <div className="chat-empty__tip">
                  <Zap size={18} />
                  <span>Real-time WebSocket sync</span>
                </div>
              </div>

              <div className="chat-empty__instructions">
                Select a user from the sidebar to start a secure session. All conversations are encrypted on your device.
              </div>

              <div className="chat-empty__footer mono">
                Protocol: Signal v3 · Latency: 42ms · Status: Secure
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Right: Inbox Sidebar */}
      <RightSidebar open={inboxOpen} onClose={closeInbox} />

      {/* Inbox Mobile Overlay */}
      {inboxOpen && (
        <div className="sidebar-overlay active" onClick={closeInbox} style={{ zIndex: 940 }} />
      )}

    </div>
  );
}
