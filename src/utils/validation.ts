// URL validation utilities for security

const BLOCKED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'internal',
  'local'
];

const SUSPICIOUS_PATTERNS = [
  /javascript:/i,
  /data:/i,
  /file:/i,
  /ftp:/i,
  /<script/i,
  /\.\./
];

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }
    
    // Block internal/private networks
    const hostname = urlObj.hostname.toLowerCase();
    if (BLOCKED_DOMAINS.some(domain => hostname.includes(domain))) {
      return false;
    }
    
    // Check for suspicious patterns
    if (SUSPICIOUS_PATTERNS.some(pattern => pattern.test(url))) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  // Remove any potentially dangerous characters
  const cleaned = url.trim().replace(/[<>'"]/g, '');
  
  // Ensure URL has protocol
  if (!/^https?:\/\//i.test(cleaned)) {
    return `https://${cleaned}`;
  }
  
  return cleaned;
}

export function validateAndSanitizeUrl(url: string): { isValid: boolean; sanitizedUrl: string; error?: string } {
  if (!url || url.trim().length === 0) {
    return { isValid: false, sanitizedUrl: '', error: 'URL is required' };
  }

  const sanitized = sanitizeUrl(url);
  
  if (!isValidUrl(sanitized)) {
    return { isValid: false, sanitizedUrl: sanitized, error: 'Please enter a valid URL (e.g., https://example.com)' };
  }

  return { isValid: true, sanitizedUrl: sanitized };
}