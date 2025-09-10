/**
 * Image URL Resolver Utility
 * 
 * This utility ensures all images are served from Cloudflare R2 instead of local storage.
 * It provides functions to resolve image URLs and handle both R2 and legacy local URLs.
 */

/**
 * Resolves an image URL to ensure it points to Cloudflare R2
 * @param imageUrl - The image URL (could be local or R2)
 * @returns The resolved R2 URL or null if no valid image
 */
export function resolveImageUrl(imageUrl: string | undefined | null): string | null {
  if (!imageUrl || imageUrl.trim() === '') {
    return null; // No fallback - let components handle missing images
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

  // No valid image found
  return null;
}

/**
 * Resolves multiple image URLs
 * @param imageUrls - Array of image URLs
 * @returns Array of resolved R2 URLs (filtered to remove nulls)
 */
export function resolveImageUrls(imageUrls: (string | undefined | null)[]): string[] {
  return imageUrls.map(resolveImageUrl).filter((url): url is string => url !== null);
}

/**
 * Gets the primary image URL for a property
 * @param property - Property object with image fields
 * @returns The primary image URL or null if no valid image
 */
export function getPrimaryImageUrl(property: {
  thumbnailImage?: string;
  images?: string[];
  image?: string;
}): string | null {
  return resolveImageUrl(
    property.thumbnailImage || 
    property.images?.[0] || 
    property.image
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
  
  // Add thumbnail image if it exists
  if (property.thumbnailImage) {
    const resolvedThumbnail = resolveImageUrl(property.thumbnailImage);
    if (resolvedThumbnail) {
      urls.push(resolvedThumbnail);
    }
  }
  
  // Add additional images from the images array, but exclude any that match the thumbnail
  if (property.images && Array.isArray(property.images)) {
    const resolvedImages = resolveImageUrls(property.images);
    
    // Filter out any images that are the same as the thumbnail to prevent duplication
    const resolvedThumbnail = property.thumbnailImage ? resolveImageUrl(property.thumbnailImage) : null;
    const uniqueImages = resolvedImages.filter(img => {
      // If no thumbnail, include all images
      if (!resolvedThumbnail) {
        return true;
      }
      // Exclude images that match the thumbnail URL
      const isDuplicate = img === resolvedThumbnail;
      if (isDuplicate) {
        console.log('🖼️ Filtering out duplicate thumbnail from additional images:', img);
      }
      return !isDuplicate;
    });
    urls.push(...uniqueImages);
  }
  
  // Fallback: if no thumbnail or images array, use the single image field
  if (property.image && !property.thumbnailImage && !property.images?.length) {
    const resolvedImage = resolveImageUrl(property.image);
    if (resolvedImage) {
      urls.push(resolvedImage);
    }
  }
  
  // Remove any remaining duplicates and filter out null/undefined values
  const finalUrls = Array.from(new Set(urls.filter(url => url !== null && url !== undefined)));
  
  // Additional check: if we only have one unique image, make sure we don't return duplicates
  if (finalUrls.length === 1) {
    return finalUrls;
  }
  
  // If we have multiple URLs but they're all the same, return only one
  const uniqueUrls = [...new Set(finalUrls)];
  if (uniqueUrls.length === 1 && finalUrls.length > 1) {
    return [uniqueUrls[0]];
  }
  
  return finalUrls;
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
 * Gets additional image URLs (excluding the primary/thumbnail image)
 * @param property - Property object with image fields
 * @returns Array of additional image URLs
 */
export function getAdditionalImageUrls(property: {
  thumbnailImage?: string;
  images?: string[];
  image?: string;
}): string[] {
  const allUrls = getAllImageUrls(property);
  const primaryUrl = getPrimaryImageUrl(property);
  
  if (!primaryUrl) {
    return allUrls;
  }
  
  // Return all URLs except the primary one
  return allUrls.filter(url => url !== primaryUrl);
}

/**
 * Checks if an image URL is a local upload
 * @param imageUrl - The image URL to check
 * @returns True if the URL is a local upload
 */
export function isLocalUploadUrl(imageUrl: string): boolean {
  return imageUrl.startsWith('/uploads/');
}
