import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML to prevent XSS attacks while allowing safe tags.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'code', 'pre', 'span', 'div', 'blockquote', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'figure', 'figcaption', 'details', 'summary',
      'video', 'audio', 'source'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height',
      'frameborder', 'allow', 'allowfullscreen', 'title', 'autoplay', 'controls', 'muted', 'loop', 'type'
    ]
  });
}

/**
 * Validates URL parameters to prevent injection attacks.
 * Returns null if validation fails, otherwise returns the validated value.
 */
export function validateUrlParam(param: string | undefined): string | null {
  if (!param) return null;

  // Reject obviously dangerous patterns
  const dangerousPatterns = [
    /\.\./,        // Directory traversal
    /<script/i,    // Script tags
    /javascript:/i, // JavaScript protocol
    /onerror=/i,   // Event handlers
    /onload=/i,    // Event handlers
    /data:/i,      // Data URLs (can be used for XSS)
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(param)) {
      return null;
    }
  }

  // Only allow alphanumeric, hyphens, underscores, and common URL-safe characters
  // This is a basic validation; specific params may need more specific rules
  const safePattern = /^[a-zA-Z0-9-_~.+]+$/;
  if (!safePattern.test(param)) {
    return null;
  }

  // Length limit to prevent DoS
  if (param.length > 256) {
    return null;
  }

  return param;
}

/**
 * Validates numeric ID parameters (UUID or integer).
 */
export function validateIdParam(param: string | undefined): string | null {
  if (!param) return null;

  // Check for UUID format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(param)) {
    return param;
  }

  // Check for numeric ID (positive integers only)
  const numericPattern = /^\d+$/;
  if (numericPattern.test(param)) {
    return param;
  }

  // Check for slug-like format (alphanumeric with hyphens)
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (slugPattern.test(param)) {
    return param;
  }

  return null;
}
