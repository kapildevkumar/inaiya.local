// utils.js

/**
 * @fileoverview Utilities & Helpers
 * Pure functions for data manipulation, security, and validation.
 * Contains no side effects or application state.
 */

import DOMPurify from 'dompurify';

/**
 * Deep Merge Utility
 * Recursively merges two objects. Used to merge user data with default configuration
 * to ensure new features (defaults) appear even if the DB has old data.
 * 
 * @param {Object} target - The base object to merge into
 * @param {Object} source - The object containing updates/overrides
 * @returns {Object} The merged target object
 */
export function deepMerge(target, source) {
  if (!source) return target;

  const isObject = (item) => (item && typeof item === 'object' && !Array.isArray(item));

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return target;
}

// ==========================================
// SECURITY: XSS PREVENTION
// ==========================================

/**
 * Sanitizes HTML input to prevent Cross-Site Scripting (XSS) attacks.
 * Configured to allow only safe formatting tags (bold, italics, etc.).
 * 
 * @param {string} str - The raw HTML string (potentially unsafe)
 * @returns {string} The sanitized HTML string
 */
export function sanitize(str) {
  if (!str) return '';
  
  return DOMPurify.sanitize(str, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span', 'u'],
    ALLOWED_ATTR: ['href', 'target', 'class', 'aria-label']
  });
}

/**
 * Validates form inputs based on type.
 * 
 * @param {string} value - The value to check
 * @param {string} type - 'required', 'url', or 'date'
 * @param {string} label - Human-readable name for error messages
 * @returns {string|null} Error message string or null if valid
 */
export function validateInput(value, type, label) {
  if (type === 'required' && (!value || value.trim() === '')) return `${label} is required.`;
  
  if (type === 'url' && value) {
    // Regex checks for http:// or https:// protocol
    if (!value.match(/^(http|https):\/\/[^ "]+$/)) return `${label} must be a valid URL.`;
  }

  if (type === 'date' && value) {
    if (isNaN(new Date(value).getTime())) return `${label} is not a valid date.`;
  }

  return null;
}

// ==========================================
// YOUTUBE HELPERS
// ==========================================

/**
 * Extracts the Video ID from various YouTube URL formats.
 * Handles standard URLs, 'youtu.be' shortlinks, and embed codes.
 * 
 * @param {string} input - The full YouTube URL
 * @returns {string|null} The 11-character Video ID
 */
export function getYouTubeId(input) {
  if (!input) return null;
  try {
    const url = new URL(input);
    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
      if (url.searchParams.get('v')) return url.searchParams.get('v');
      if (url.pathname.slice(1)) return url.pathname.slice(1);
    }
  } catch (e) {
    // Fallback: if the user pasted just the ID
    if (input.length === 11) return input;
  }
  return null;
}

export function getYouTubeEmbedUrl(input) {
  const id = getYouTubeId(input);
  return id ? `https://www.youtube.com/embed/${id}` : input;
}

// ==========================================
// CRYPTOGRAPHY
// ==========================================

/**
 * Generates a SHA-256 hash of a message.
 * Used for simple client-side password verification (App Password).
 * 
 * @param {string} message - The plain text to hash
 * @returns {Promise<string>} The hex string of the hash
 */
export async function digestMessage(message) {
  if (!window.crypto || !window.crypto.subtle) {
    if (window.location.hostname !== 'localhost' && window.location.protocol !== 'https:') {
      console.warn("Security Warning: This site should be run on HTTPS.");
    }
  }
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  // Convert buffer to hex string
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}