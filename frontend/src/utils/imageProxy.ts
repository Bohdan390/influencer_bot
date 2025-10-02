/**
 * Image proxy utility to handle cross-origin issues
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Get proxied image URL to avoid cross-origin issues
 * @param originalUrl - The original image URL
 * @returns Proxied image URL or original URL if invalid
 */
export function getProxiedImageUrl(originalUrl: string | null | undefined): string | undefined {
  if (!originalUrl) {
    return undefined;
  }

  // If it's already a proxied URL, return as is
  if (originalUrl.includes('/api/images/proxy')) {
    return originalUrl;
  }

  // If it's a data URL or relative URL, return as is
  if (originalUrl.startsWith('data:') || originalUrl.startsWith('/')) {
    return originalUrl;
  }

  // If it's a localhost URL, return as is
  if (originalUrl.includes('localhost') || originalUrl.includes('127.0.0.1')) {
    return originalUrl;
  }

  // For external URLs, use the proxy
  try {
    const encodedUrl = encodeURIComponent(originalUrl);
    return `${API_BASE}/api/images/proxy?url=${encodedUrl}`;
  } catch (error) {
    console.warn('Failed to encode image URL:', originalUrl, error);
    return originalUrl; // Fallback to original URL
  }
}

/**
 * Check if an image URL is valid and should be proxied
 * @param url - The image URL to check
 * @returns True if the URL should be proxied
 */
export function shouldProxyImage(url: string | null | undefined): boolean {
  if (!url) return false;
  
  // Don't proxy data URLs, relative URLs, or localhost URLs
  if (url.startsWith('data:') || url.startsWith('/') || url.includes('localhost')) {
    return false;
  }
  
  // Don't proxy if already proxied
  if (url.includes('/api/images/proxy')) {
    return false;
  }
  
  return true;
}

/**
 * Get image info without downloading the full image
 * @param imageUrl - The image URL to get info for
 * @returns Promise with image info or null if failed
 */
export async function getImageInfo(imageUrl: string): Promise<{
  contentType?: string;
  contentLength?: string;
  lastModified?: string;
  etag?: string;
} | null> {
  try {
    const encodedUrl = encodeURIComponent(imageUrl);
    const response = await fetch(`${API_BASE}/api/images/info?url=${encodedUrl}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.success ? data.info : null;
  } catch (error) {
    console.warn('Failed to get image info:', error);
    return null;
  }
}
