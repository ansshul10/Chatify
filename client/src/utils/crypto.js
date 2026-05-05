/**
 * AES-256 client-side encryption/decryption
 */
import CryptoJS from 'crypto-js';

export function encryptMessage(text, key) {
  if (!text || !key) return text;
  try {
    const encrypted = CryptoJS.AES.encrypt(text, key).toString();
    return encrypted;
  } catch {
    return text;
  }
}

export function decryptMessage(ciphertext, key) {
  if (!ciphertext || !key) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch {
    return null;
  }
}

export function getKeyFingerprint(key) {
  if (!key) return '';
  const hash = CryptoJS.SHA256(key).toString();
  return hash.slice(-4).toUpperCase();
}
