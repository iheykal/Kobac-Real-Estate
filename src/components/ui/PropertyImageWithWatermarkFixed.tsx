'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface PropertyImageWithWatermarkProps {
  src: string
  alt: string
  className?: string
  showWatermark?: boolean
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  watermarkSize?: 'small' | 'medium' | 'large'
}

export const PropertyImageWithWatermarkFixed: React.FC<PropertyImageWithWatermarkProps> = ({
  src,
  alt,
  className = '',
  showWatermark = true,
  watermarkPosition = 'center',
  watermarkSize = 'medium'
}) => {
  // Watermark size classes
  const watermarkSizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  }

  // Watermark position classes
  const watermarkPositionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Main Property Image */}
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-center"
        style={{
          imageRendering: 'auto',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)'
        }}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          console.log('🖼️ Image failed to load:', src);
          // Use a more appropriate fallback image
          target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
        }}
        onLoad={() => {
          console.log('🖼️ Image loaded successfully:', src);
        }}
      />
      
      {/* Company Logo Watermark */}
      {showWatermark && (
        <motion.div
          className={`absolute ${watermarkPositionClasses[watermarkPosition]} z-10 pointer-events-none`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className={`${watermarkSizeClasses[watermarkSize]} relative`}>
            {/* Company Logo */}
            <img
              src="/icons/header.png"
              alt="Kobac Company Logo"
              className="w-full h-full object-contain"
              style={{
                opacity: 0.7,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8)) brightness(1.3) contrast(1.2)'
              }}
              loading="lazy"
            />
          </div>
        </motion.div>
      )}
    </div>
  )
}
