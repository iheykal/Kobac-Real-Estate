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

export const PropertyImageWithWatermark: React.FC<PropertyImageWithWatermarkProps> = ({
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
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        loading="lazy"
      />
      
      {/* Company Logo Watermark */}
      {showWatermark && (
        <motion.div
          className={`absolute ${watermarkPositionClasses[watermarkPosition]} z-10`}
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
                opacity: 0.9,
                filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.6)) brightness(1.2) contrast(1.4) saturate(1.1)'
              }}
              loading="lazy"
            />
          </div>
        </motion.div>
      )}
    </div>
  )
}
