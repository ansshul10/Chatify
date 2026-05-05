/**
 * MessageList — scrollable message area with auto-scroll, date grouping, typing indicator
 */
import { useEffect, useRef, useCallback } from 'react';
import MessageItem from './MessageItem.jsx';
import useChatStore from '../../store/chatStore.js';
import { formatDate } from '../../utils/formatTime.js';
import './chat.css';

// Stable fallback — module-level constant so selector never returns a new [] reference
const EMPTY_TYPING = [];

export default function MessageList({ encryptionKey }) {
  // Individual selectors — avoids object identity churn that causes infinite loops
  const messages           = useChatStore((s) => s.messages);
  const isLoadingMessages  = useChatStore((s) => s.isLoadingMessages);
  const hasMore            = useChatStore((s) => s.hasMore);
  const activeConversation = useChatStore((s) => s.activeConversation);
  const fetchMessages      = useChatStore((s) => s.fetchMessages);

  // Stable typing selector — never returns a new [] literal (root cause of the error)
  const typingUsers = useChatStore(
    (s) => s.typingUsers[activeConversation?._id] ?? EMPTY_TYPING
  );

  const bottomRef     = useRef(null);
  const containerRef  = useRef(null);
  const prevLengthRef = useRef(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  // Scroll to bottom when switching conversations
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView(), 100);
  }, [activeConversation?._id]);

  // Infinite scroll up — load older messages
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || !hasMore || isLoadingMessages) return;
    if (el.scrollTop < 100) {
      const oldest = messages[0];
      if (oldest) fetchMessages(activeConversation._id, oldest._id);
    }
  }, [hasMore, isLoadingMessages, messages, activeConversation, fetchMessages]);

  // Group messages by date for date dividers
  const grouped = [];
  let lastDate = '';
  for (const msg of messages) {
    const d = formatDate(msg.createdAt);
    if (d !== lastDate) {
      grouped.push({ type: 'date', date: d });
      lastDate = d;
    }
    grouped.push({ type: 'msg', data: msg });
  }

  return (
    <div className="message-list" ref={containerRef} onScroll={handleScroll}>
      {isLoadingMessages && (
        <div className="message-list__loading">
          <span className="message-list__loading-text mono">Loading messages...</span>
        </div>
      )}

      {!isLoadingMessages && messages.length === 0 && (
        <div className="message-list__empty">
          <div className="empty-state">
            <div className="empty-state__title">No messages yet</div>
            <div className="empty-state__description">
              Send the first message to start the conversation
            </div>
          </div>
        </div>
      )}

      {grouped.map((item, i) =>
        item.type === 'date' ? (
          <div key={`date-${i}`} className="message-list__date">
            <span className="message-list__date-text mono">{item.date}</span>
          </div>
        ) : (
          <MessageItem
            key={item.data._id}
            message={item.data}
            encryptionKey={encryptionKey}
          />
        )
      )}

      {typingUsers.length > 0 && !activeConversation?.iBlockedOther && !activeConversation?.otherBlockedMe && (
        <div className="message-list__typing">
          <span className="message-list__typing-text">
            {typingUsers.length === 1 ? 'Someone is' : `${typingUsers.length} people are`} typing...
          </span>
        </div>
      )}

      {(activeConversation?.iBlockedOther || activeConversation?.otherBlockedMe) && (
        <div className="message-list__blocked-banner slide-up">
          <div className="blocked-banner__content">
            {activeConversation?.iBlockedOther ? (
              <span>You have blocked this user.</span>
            ) : (
              <span>You have been blocked by this user.</span>
            )}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
