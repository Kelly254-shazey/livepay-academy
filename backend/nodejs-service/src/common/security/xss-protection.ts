/**
 * XSS (Cross-Site Scripting) Protection
 * Input sanitization and output encoding (server-side)
 */

/**
 * Strip HTML tags from input
 */
function stripHtmlTags(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/gi, '')
    .replace(/&#\d+;/g, '');
}

/**
 * Sanitize HTML to prevent XSS - removes all potentially dangerous content
 */
export function sanitizeHtml(
  input: string,
  context?: string
): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const stripped = stripHtmlTags(input);
  const trimmed = stripped.trim().slice(0, 10000);
  
  return trimmed;
}

/**
 * Encode HTML special characters
 */
export function encodeHtmlEntity(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  return text.replace(/[&<>"']/g, char => map[char] || char);
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  return encodeHtmlEntity(text);
}

/**
 * Encode URL attributes
 */
export function encodeUrlAttribute(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    const parsed = new URL(url.startsWith('/') ? `https://temp.local${url}` : url);
    
    if (['javascript:', 'data:', 'vbscript:'].includes(parsed.protocol)) {
      return '';
    }

    if (url.startsWith('/') || url.startsWith('.')) {
      return encodeURI(url);
    }

    return parsed.toString();
  } catch {
    if (url.startsWith('/') || url.startsWith('.')) {
      return encodeURI(url);
    }
    return '';
  }
}

/**
 * Validate and sanitize user message for real-time chat
 */
export function sanitizeChatMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    throw new Error('Message must be a non-empty string');
  }

  const trimmed = message.trim();

  if (trimmed.length === 0) {
    throw new Error('Message cannot be empty');
  }

  if (trimmed.length > 2000) {
    throw new Error('Message is too long (max 2000 characters)');
  }

  const sanitized = sanitizeHtml(trimmed, 'STRICT');

  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Message contains invalid content');
    }
  }

  return sanitized;
}

/**
 * Validate user input fields
 */
export function sanitizeUsername(username: string): string {
  if (!username || typeof username !== 'string') {
    throw new Error('Username must be a non-empty string');
  }

  const sanitized = username.trim();

  if (!/^[a-zA-Z0-9_-]{3,32}$/.test(sanitized)) {
    throw new Error('Username contains invalid characters');
  }

  return sanitized;
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    throw new Error('Email must be a non-empty string');
  }

  const sanitized = email.trim().toLowerCase();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(sanitized)) {
    throw new Error('Invalid email format');
  }

  if (/[\r\n]/.test(sanitized)) {
    throw new Error('Invalid email format');
  }

  return sanitized;
}

/**
 * Create Content Security Policy header value
 */
export function getContentSecurityPolicyHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' wss: ws:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');
}

/**
 * Validate redirect URL (prevent open redirects)
 */
export function validateRedirectUrl(url: string, allowedOrigins: string[] = []): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Block protocol-relative URLs (//example.com)
  if (url.startsWith('//')) {
    return false;
  }

  // Block data and javascript URLs
  if (/^(data|javascript):/i.test(url)) {
    return false;
  }

  // If absolute URL, check against whitelist
  if (url.startsWith('http')) {
    try {
      const parsed = new URL(url);
      return allowedOrigins.length === 0 || 
             allowedOrigins.some(origin => parsed.origin === new URL(origin).origin);
    } catch {
      return false;
    }
  }

  // Allow relative URLs
  return /^\/[^/]/.test(url);
}
