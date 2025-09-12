'use client';

import { useState } from 'react';
import { getPrimaryImageUrl, getAllImageUrls } from '@/lib/imageUrlResolver';

interface PropertyImageProps {
  property: {
    thumbnailImage?: string;
    images?: string[];
    image?: string;
    title?: string;
  };
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  priority?: boolean;
  fallbackComponent?: React.ReactNode;
  onError?: (error: string) => void;
  index?: number;
}

/**
 * PropertyImage component that displays property images from Cloudflare R2
 * Handles missing images gracefully with proper fallbacks
 */
export default function PropertyImage({
  property,
  alt,
  className = '',
  loading = 'lazy',
  sizes,
  priority = false,
  fallbackComponent,
  onError,
  index = 0
}: PropertyImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackError, setFallbackError] = useState(false);

  const getImageUrl = () => {
    if (index === 0 || !property.images?.length) {
      return getPrimaryImageUrl(property);
    }
    
    const imageIndex = index - 1;
    if (property.images && imageIndex < property.images.length) {
      return property.images[imageIndex];
    }
    
    return getPrimaryImageUrl(property);
  };
  
  const imageUrl = getImageUrl();
  
  if (!imageUrl || imageError) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }
    
    if (!fallbackError) {
      return (
        <div className={`relative ${className}`}>
          {isLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
          )}
          <img
            src="/icons/villa-2.webp"
            alt={alt || property.title || 'Property image'}
            loading={loading}
            sizes={sizes}
            onError={() => {
              setFallbackError(true);
              setIsLoading(false);
            }}
            onLoad={() => setIsLoading(false)}
            className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </div>
      );
    }
    
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        role="img"
        aria-label={alt || property.title || 'Property image not available'}
      />
    );
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.error('Property image failed to load:', {
      propertyId: property.title,
      imageUrl: imageUrl,
      allImages: getAllImageUrls(property),
      requestedIndex: index,
      src: target.src,
      naturalWidth: target.naturalWidth,
      naturalHeight: target.naturalHeight,
      complete: target.complete,
      isR2Url: imageUrl ? imageUrl.includes('r2.dev') || imageUrl.includes('r2.cloudflarestorage.com') : false
    });
    
    setImageError(true);
    setIsLoading(false);
    
    if (onError) {
      onError(`Failed to load image at index ${index}: ${imageUrl}`);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      
      <img
        src={imageUrl}
        alt={alt || property.title || 'Property image'}
        loading={loading}
        sizes={sizes}
        onError={handleImageError}
        onLoad={handleImageLoad}
        className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
}

/**
 * Hook to get property image data
 */
export function usePropertyImages(property: {
  thumbnailImage?: string;
  images?: string[];
  image?: string;
}) {
  const primaryImageUrl = getPrimaryImageUrl(property);
  const allImageUrls = getAllImageUrls(property);
  
  return {
    primaryImageUrl,
    allImageUrls,
    hasImages: allImageUrls.length > 0,
    imageCount: allImageUrls.length
  };
}