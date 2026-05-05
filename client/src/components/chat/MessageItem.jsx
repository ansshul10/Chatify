/**
 * MessageItem — single message with reactions, replies, status
 */
import { memo, useState } from 'react';
import {
  MoreHorizontal, Reply, Smile, Trash2, Edit, Bookmark, Lock, Clock,
} from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import useAuthStore from '../../store/authStore.js';
import useChatStore from '../../store/chatStore.js';
import { formatTime } from '../../utils/formatTime.js';
import { decryptMessage, getKeyFingerprint } from '../../utils/crypto.js';
import { EMOJI_REACTIONS, MESSAGE_EDIT_WINDOW_MS } from '../../utils/constants.js';
import './chat.css';

const MessageItem = memo(function MessageItem({ message, encryptionKey }) {
  const user = useAuthStore((s) => s.user);
  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const setEditingMessage = useChatStore((s) => s.setEditingMessage);
  const reactToMessage = useChatStore((s) => s.reactToMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const toggleBookmark = useChatStore((s) => s.toggleBookmark);

  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dontShowDeletePrompt, setDontShowDeletePrompt] = useState(false);

  const isMine = message.senderId === user?._id || message.senderId?._id === user?._id;
  const isDeleted = message.isDeleted;

  // Decrypt if needed
  let displayContent = message.content;
  if (message.isEncrypted && !isDeleted) {
    const decrypted = decryptMessage(message.content, encryptionKey);
    displayContent = decrypted || (
      <span className="message__encrypted-text" title="End-to-end encrypted">
        U2FsdGVkX19{message.content?.substring(0, 8)}...{message.content?.substring(message.content.length - 4)}
      </span>
    );
  }

  const canEdit =
    isMine &&
    !isDeleted &&
    Date.now() - new Date(message.createdAt).getTime() < MESSAGE_EDIT_WINDOW_MS;

  const senderName = isMine
    ? 'You'
    : message.senderId?.displayName || message.senderId?.username || 'User';

  const handleDelete = () => {
    const skipPrompt = localStorage.getItem('skip_delete_prompt') === 'true';
    if (skipPrompt) {
      deleteMessage(message._id);
    } else {
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = () => {
    if (dontShowDeletePrompt) {
      localStorage.setItem('skip_delete_prompt', 'true');
    }
    deleteMessage(message._id);
    setShowDeleteModal(false);
  };

  return (
    <div
      className={`message ${isMine ? 'message--mine' : 'message--other'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {!isMine && (
        <Avatar
          src={message.senderId?.avatar}
          name={senderName}
          size={32}
        />
      )}
      <div className="message__body">
        {/* Reply preview */}
        {message.replyTo && (
          <div className="message__reply-preview">
            <span className="message__reply-author">
              {message.replyTo.senderId?.username || 'User'}
            </span>
            <span className="message__reply-text truncate">
              {message.replyTo.content}
            </span>
          </div>
        )}

        <div className={`message__bubble ${isMine ? 'message__bubble--mine' : ''}`}>
          {isDeleted ? (
            <span className="message__deleted">[deleted]</span>
          ) : (
            <>
              {!isMine && (
                <span className="message__sender">{senderName}</span>
              )}
              <span className="message__content">{displayContent}</span>
              {message.isEncrypted && !isDeleted && (
                <span className="message__encrypted-badge mono">
                  <Lock size={10} />
                  {encryptionKey ? `Key: ••••${getKeyFingerprint(encryptionKey)}` : 'Encrypted'}
                </span>
              )}
              {message.selfDestructAt && !isDeleted && (
                <span className="message__self-destruct-badge" title={`Expiring at ${new Date(message.selfDestructAt).toLocaleTimeString()}`}>
                  <Clock size={10} />
                </span>
              )}
            </>
          )}
          <div className="message__meta">
            <span className="message__time mono">{formatTime(message.createdAt)}</span>
            {message.isEdited && (
              <span className="message__edited mono">edited</span>
            )}
            {isMine && (
              <span className={`message__status ${message.status === 'read' ? 'message__status--read' : ''}`}>
                {message.status === 'read' ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="message__reactions">
            {message.reactions.map((r) => (
              <span
                key={r.emoji}
                className={`message__reaction ${r.users?.some(u => (u._id || u) === user?._id) ? 'message__reaction--active' : ''}`}
                onClick={() => reactToMessage(message._id, r.emoji)}
              >
                {r.emoji} {r.count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action bar */}
      {showActions && !isDeleted && (
        <div className="message__actions">
          <button
            className="message__action-btn"
            title="React"
            onClick={() => setShowReactions(!showReactions)}
          >
            <Smile size={14} />
          </button>
          <button
            className="message__action-btn"
            title="Reply"
            onClick={() => setReplyTo(message)}
          >
            <Reply size={14} />
          </button>
          {isMine && canEdit && (
            <button
              className="message__action-btn"
              title="Edit"
              onClick={() => setEditingMessage(message)}
            >
              <Edit size={14} />
            </button>
          )}
          <button
            className={`message__action-btn ${message.isBookmarked ? 'message__action-btn--active' : ''}`}
            title={message.isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
            onClick={() => toggleBookmark(message._id)}
          >
            <Bookmark size={14} fill={message.isBookmarked ? 'currentColor' : 'none'} />
          </button>
          {isMine && (
            <button
              className="message__action-btn message__action-btn--danger"
              title="Delete"
              onClick={handleDelete}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}

      {/* Reaction picker */}
      {showReactions && (
        <div className="message__reaction-picker">
          {EMOJI_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              className="message__reaction-btn"
              onClick={() => {
                reactToMessage(message._id, emoji);
                setShowReactions(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Message"
        width={400}
      >
        <div className="delete-modal-content">
          <p className="delete-modal-text">
            Are you sure you want to delete this message? This action <strong>cannot be undone</strong> and the message will be removed for everyone.
          </p>

          <label className="delete-modal-checkbox-label">
            <input
              type="checkbox"
              checked={dontShowDeletePrompt}
              onChange={(e) => setDontShowDeletePrompt(e.target.checked)}
            />
            Don't ask me again
          </label>

          <div className="delete-modal-actions">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
});

export default MessageItem;
