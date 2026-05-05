export const APP_NAME = 'Chatify';
export const API_URL = import.meta.env.VITE_API_URL || '';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
export const MESSAGES_PER_PAGE = 30;
export const TYPING_DEBOUNCE_MS = 300;
export const TYPING_TIMEOUT_MS = 3000;
export const MESSAGE_EDIT_WINDOW_MS = 5 * 60 * 1000;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_BIO_LENGTH = 200;

export const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
