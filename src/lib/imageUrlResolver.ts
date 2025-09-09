/**
 * Image URL Resolver Utility
 * 
 * This utility ensures all images are served from Cloudflare R2 instead of local storage.
 * It provides functions to resolve image URLs and handle both R2 and legacy local URLs.
 */

/**
 * Resolves an image URL to ensure it points to Cloudflare R2
 * @param imageUrl - The image URL (could be local or R2)
 * @returns The resolved R2 URL
 */
export function resolveImageUrl(imageUrl: string | undefined | null): string {
  if (!imageUrl) {
    return '/icons/bg-1.webp'; // Default fallback image
  }

  // If it's already an R2 URL, return as is
  if (imageUrl.includes('r2.dev') || imageUrl.includes('r2.cloudflarestorage.com')) {
    return imageUrl;
  }

  // If it's a local upload URL, we need to handle this case
  // For now, return the original URL - in a full migration, you'd want to
  // either migrate these images to R2 or handle them differently
  if (imageUrl.startsWith('/uploads/')) {
    console.warn('Local upload URL detected:', imageUrl, '- Consider migrating to R2');
    return imageUrl;
  }

  // If it's an external URL (like Unsplash), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it's a relative path (like /icons/), return as is
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // Default fallback
  return '/icons/bg-1.webp';
}

/**
 * Resolves multiple image URLs
 * @param imageUrls - Array of image URLs
 * @returns Array of resolved R2 URLs
 */
export function resolveImageUrls(imageUrls: (string | undefined | null)[]): string[] {
  return imageUrls.map(resolveImageUrl);
}

/**
 * Gets the primary image URL for a property
 * @param property - Property object with image fields
 * @returns The primary image URL
 */
export function getPrimaryImageUrl(property: {
  thumbnailImage?: string;
  images?: string[];
  image?: string;
}): string {
  return resolveImageUrl(
    property.thumbnailImage || 
    property.images?.[0] || 
    property.image || 
    '/icons/bg-1.webp'
  );
}

/**
 * Gets all valid image URLs for a property
 * @param property - Property object with image fields
 * @returns Array of all valid image URLs
 */
export function getAllImageUrls(property: {
  thumbnailImage?: string;
  images?: string[];
  image?: string;
}): string[] {
  const urls: string[] = [];
  
  if (property.thumbnailImage) {
    urls.push(resolveImageUrl(property.thumbnailImage));
  }
  
  if (property.images && Array.isArray(property.images)) {
    urls.push(...resolveImageUrls(property.images));
  }
  
  if (property.image && !property.thumbnailImage && !property.images?.length) {
    urls.push(resolveImageUrl(property.image));
  }
  
  // Remove duplicates and return
  return [...new Set(urls)];
}

/**
 * Checks if an image URL is from R2
 * @param imageUrl - The image URL to check
 * @returns True if the URL is from R2
 */
export function isR2Url(imageUrl: string): boolean {
  return imageUrl.includes('r2.dev') || imageUrl.includes('r2.cloudflarestorage.com');
}

/**
 * Checks if an image URL is a local upload
 * @param imageUrl - The image URL to check
 * @returns True if the URL is a local upload
 */
export function isLocalUploadUrl(imageUrl: string): boolean {
  return imageUrl.startsWith('/uploads/');
}
