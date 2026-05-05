/**
 * MessageInput — compose bar with encryption toggle, reply preview
 */
import { useState, useRef, useEffect } from 'react';
import { Send, Lock, Unlock, X, Smile, Paperclip, ShieldCheck, ShieldAlert, Key, Ban, Clock } from 'lucide-react';
import useChatStore from '../../store/chatStore.js';
import useAuthStore from '../../store/authStore.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { encryptMessage, getKeyFingerprint } from '../../utils/crypto.js';
import { MAX_MESSAGE_LENGTH } from '../../utils/constants.js';
import { getSocket } from '../../services/socket.js';
import './chat.css';

export default function MessageInput({ encryptionKey, isEncryptionOn, onToggleEncryption }) {
  const [content, setContent] = useState('');
  const sendMessage        = useChatStore((s) => s.sendMessage);
  const editMessage        = useChatStore((s) => s.editMessage);
  const replyTo            = useChatStore((s) => s.replyTo);
  const clearReplyTo       = useChatStore((s) => s.clearReplyTo);
  const editingMessage     = useChatStore((s) => s.editingMessage);
  const clearEditingMessage = useChatStore((s) => s.clearEditingMessage);
  const activeConversation = useChatStore((s) => s.activeConversation);
  const unblockUser        = useChatStore((s) => s.unblockUser);
  
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [selfDestructMinutes, setSelfDestructMinutes] = useState(null);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const iBlockedOther = activeConversation?.iBlockedOther;
  const otherBlockedMe = activeConversation?.otherBlockedMe;
  const isBlocked = iBlockedOther || otherBlockedMe;

  useEffect(() => {
    inputRef.current?.focus();
    if (editingMessage) {
      setContent(editingMessage.content);
    } else {
      setContent('');
    }
  }, [activeConversation?._id, replyTo, editingMessage]);

  const handleTyping = () => {
    const socket = getSocket();
    if (!socket || !activeConversation) return;

    socket.emit('typing:start', {
      conversationId: activeConversation._id,
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', {
        conversationId: activeConversation._id,
      });
    }, 3000);
  };

  const handleSend = () => {
    const text = content.trim();
    if (!text) return;

    let finalContent = text;
    if (isEncryptionOn && encryptionKey) {
      finalContent = encryptMessage(text, encryptionKey);
    }

    if (editingMessage) {
      editMessage(editingMessage._id, finalContent, {
        isEncrypted: isEncryptionOn && !!encryptionKey,
      });
    } else {
      sendMessage(finalContent, {
        isEncrypted: isEncryptionOn && !!encryptionKey,
        replyTo: replyTo?._id,
        selfDestructMinutes: selfDestructMinutes,
      });
    }

    setContent('');

    // Stop typing
    const socket = getSocket();
    if (socket && activeConversation) {
      socket.emit('typing:stop', {
        conversationId: activeConversation._id,
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleEncryptionWithInfo = () => {
    const skipInfo = localStorage.getItem('skip_encryption_info') === 'true';
    if (!isEncryptionOn && !skipInfo) {
      setShowInfoModal(true);
    } else {
      onToggleEncryption();
    }
  };

  const handleConfirmInfo = () => {
    if (!encryptionKey && !tempKey.trim()) {
      alert('Please enter an encryption key');
      return;
    }

    if (dontShowAgain) {
      localStorage.setItem('skip_encryption_info', 'true');
    }
    setShowInfoModal(false);
    onToggleEncryption(tempKey.trim());
    setTempKey('');
  };

  const charCount = content.length;
  const isOverLimit = charCount > MAX_MESSAGE_LENGTH;

  if (otherBlockedMe) {
    return (
      <div className="message-input__blocked message-input__blocked--other">
        <Ban size={20} color="var(--danger)" />
        <div className="message-input__blocked-content">
          <p>You have been blocked by this user. You cannot send messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-input-container">
      {/* Edit preview */}
      {editingMessage && (
        <div className="message-input__reply message-input__edit">
          <div className="message-input__reply-info">
            <span className="message-input__reply-label">
              Editing message
            </span>
            <span className="message-input__reply-text truncate">
              {editingMessage.content}
            </span>
          </div>
          <button className="message-input__reply-close" onClick={clearEditingMessage}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="message-input__reply">
          <div className="message-input__reply-info">
            <span className="message-input__reply-label">
              Replying to {replyTo.senderId?.username || 'User'}
            </span>
            <span className="message-input__reply-text truncate">
              {replyTo.content}
            </span>
          </div>
          <button className="message-input__reply-close" onClick={clearReplyTo}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Encryption indicator */}
      {isEncryptionOn && encryptionKey && (
        <div className="message-input__encryption-bar mono">
          <Lock size={12} />
          <span>End-to-end encrypted · Key: ••••{getKeyFingerprint(encryptionKey)}</span>
        </div>
      )}

      {/* Input area */}
      <div className="message-input">
        <textarea
          ref={inputRef}
          className="message-input__textarea"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH + 100}
        />

        <div className="message-input__right">
          <button
            className={`message-input__btn ${selfDestructMinutes ? 'message-input__btn--active' : ''}`}
            onClick={() => setShowTimerMenu(true)}
            title="Self-destruct timer"
          >
            <Clock size={18} />
            {selfDestructMinutes && <span className="message-input__timer-badge">{selfDestructMinutes}m</span>}
          </button>

          <button
            className={`message-input__btn ${isEncryptionOn ? 'message-input__btn--active' : ''}`}
            onClick={toggleEncryptionWithInfo}
            title={isEncryptionOn ? 'Disable encryption' : 'Enable encryption'}
          >
            {isEncryptionOn ? <Lock size={18} /> : <Unlock size={18} />}
          </button>
          
          {charCount > MAX_MESSAGE_LENGTH * 0.8 && (
            <span
              className={`message-input__counter mono ${isOverLimit ? 'message-input__counter--over' : ''}`}
            >
              {charCount}/{MAX_MESSAGE_LENGTH}
            </span>
          )}
          <button
            className="message-input__send"
            onClick={handleSend}
            disabled={!content.trim() || isOverLimit}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Timer Selection Modal */}
      <Modal
        isOpen={showTimerMenu}
        onClose={() => setShowTimerMenu(false)}
        title="Self-Destruct Timer"
        width={360}
      >
        <div className="timer-selection-modal">
          <p className="timer-modal-desc">Messages sent with a timer will be automatically deleted for everyone after the specified duration.</p>
          
          <div className="timer-options-grid">
            {[
              { label: 'Off', value: null },
              { label: '1 Minute', value: 1 },
              { label: '5 Minutes', value: 5 },
              { label: '1 Hour', value: 60 },
              { label: '1 Day', value: 1440 },
              { label: '1 Week', value: 10080 }
            ].map((opt) => (
              <button
                key={opt.label}
                className={`timer-option-btn ${selfDestructMinutes === opt.value ? 'timer-option-btn--active' : ''}`}
                onClick={() => {
                  setSelfDestructMinutes(opt.value);
                  setShowTimerMenu(false);
                }}
              >
                <Clock size={14} className={opt.value ? 'active-icon' : ''} />
                {opt.label}
              </button>
            ))}
          </div>

          <div className="delete-modal-actions">
            <Button variant="ghost" onClick={() => setShowTimerMenu(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Encryption Information Modal */}
      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="End-to-End Encryption"
        width={460}
      >
        <div className="encryption-info">
          <div className="encryption-info__header">
            <ShieldCheck size={48} className="encryption-info__icon" />
            <p>Your privacy is our priority.</p>
          </div>
          
          <div className="encryption-info__content">
            <div className="encryption-info__step">
              <div className="encryption-info__step-icon"><Key size={20} /></div>
              <div className="encryption-info__step-text">
                <strong>Private Keys:</strong> Messages are locked with a key that only stays on your device.
              </div>
            </div>
            <div className="encryption-info__step">
              <div className="encryption-info__step-icon"><Lock size={20} /></div>
              <div className="encryption-info__step-text">
                <strong>Secure Transit:</strong> Even Chatify servers cannot read your messages while they are being sent.
              </div>
            </div>
            <div className="encryption-info__step">
              <div className="encryption-info__step-icon"><ShieldAlert size={20} /></div>
              <div className="encryption-info__step-text">
                <strong>Important:</strong> If you lose your encryption key, previously encrypted messages cannot be recovered.
              </div>
            </div>
          </div>

          {!encryptionKey && (
            <div className="encryption-info__input-group">
              <label className="input-label">Create Encryption Key</label>
              <input 
                type="password" 
                className="input" 
                placeholder="Enter a secret key..." 
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
              />
              <p className="input-error" style={{ fontSize: '10px', marginTop: '4px' }}>
                * This key is never sent to the server. Don't lose it!
              </p>
            </div>
          )}

          <label className="delete-modal-checkbox-label" style={{ marginTop: '10px' }}>
            <input 
              type="checkbox" 
              checked={dontShowAgain} 
              onChange={(e) => setDontShowAgain(e.target.checked)} 
            />
            Don't show this explanation again
          </label>

          <div className="delete-modal-actions">
            <Button variant="ghost" onClick={() => setShowInfoModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmInfo} style={{ background: 'var(--success)', borderColor: 'var(--success)' }}>
              Enable Encryption
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
