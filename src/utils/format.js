/**
 * @fileoverview Utility functions for formatting data
 */

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted file size
 * 
 * @example
 * formatFileSize(1024) // "1.00 KB"
 * formatFileSize(1048576) // "1.00 MB"
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format duration in MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 * 
 * @example
 * formatDuration(65) // "01:05"
 * formatDuration(3661) // "61:01"
 */
export function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @param {string} [locale='pt-BR'] - Locale for formatting
 * @returns {string} Formatted number
 * 
 * @example
 * formatNumber(1234567) // "1.234.567"
 */
export function formatNumber(num, locale = 'pt-BR') {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format date and time
 * @param {Date|string} date - Date to format
 * @param {Object} [options] - Formatting options
 * @param {string} [options.locale='pt-BR'] - Locale for formatting
 * @param {string} [options.dateStyle='short'] - Date style
 * @param {string} [options.timeStyle='medium'] - Time style
 * @returns {string} Formatted date and time
 * 
 * @example
 * formatDateTime(new Date()) // "06/10/2024 14:30:45"
 */
export function formatDateTime(date, options = {}) {
  const {
    locale = 'pt-BR',
    dateStyle = 'short',
    timeStyle = 'medium'
  } = options;

  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle
  }).format(new Date(date));
}

/**
 * Format relative time (e.g., "2 minutes ago")
 * @param {Date|string} date - Date to format
 * @param {string} [locale='pt-BR'] - Locale for formatting
 * @returns {string} Relative time string
 * 
 * @example
 * formatRelativeTime(new Date(Date.now() - 60000)) // "1 minuto atrás"
 */
export function formatRelativeTime(date, locale = 'pt-BR') {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = (targetDate - now) / 1000;

  const timeUnits = [
    { unit: 'year', seconds: 365 * 24 * 60 * 60 },
    { unit: 'month', seconds: 30 * 24 * 60 * 60 },
    { unit: 'day', seconds: 24 * 60 * 60 },
    { unit: 'hour', seconds: 60 * 60 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 }
  ];

  for (const { unit, seconds } of timeUnits) {
    const interval = Math.floor(Math.abs(diffInSeconds) / seconds);
    if (interval >= 1) {
      return rtf.format(diffInSeconds < 0 ? -interval : interval, unit);
    }
  }

  return rtf.format(0, 'second');
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} [suffix='...'] - Suffix to add when truncated
 * @returns {string} Truncated text
 * 
 * @example
 * truncateText("Long text here", 10) // "Long text..."
 */
export function truncateText(text, maxLength, suffix = '...') {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} [decimals=1] - Number of decimal places
 * @returns {string} Formatted percentage
 * 
 * @example
 * formatPercentage(0.1234) // "12.3%"
 */
export function formatPercentage(value, decimals = 1) {
  return (value * 100).toFixed(decimals) + '%';
}