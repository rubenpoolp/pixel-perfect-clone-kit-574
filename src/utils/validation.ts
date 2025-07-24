// URL validation utilities for security

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
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