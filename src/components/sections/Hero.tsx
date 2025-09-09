'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Clock, Globe, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import NextImage from 'next/image'
import { useUser } from '@/contexts/UserContext'
import { useRedirectAnimation } from '@/hooks/useRedirectAnimation'
import RedirectAnimation from '@/components/ui/RedirectAnimation'

const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { user, isAuthenticated } = useUser()
  const { isAnimating, startRedirect, animationProps } = useRedirectAnimation({
    destination: "Agent Dashboard",
    message: "Taking you to your dashboard..."
  })

  const handleAgentDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    startRedirect('/agent')
  }

  // Optimized image loader with WebP priority for better performance
  const createImageLoader = () => {
    const imageNames = [
      'happy-family',
      'villa-2', 
      'yellow-villah',
      'bg-1',
      'haanta-dheer',
      'duwaq'
    ]

    return imageNames.map(name => {
      // Prioritize WebP for better performance, then fall back to other formats
      let primarySrc, fallbacks
      
      if (name === 'haanta-dheer') {
        // haanta-dheer is corrupted in WebP, so try JPG first
        primarySrc = `/icons/${name}.jpg`
        fallbacks = [
          `/icons/${name}.png`,    // Try PNG as fallback
          `/icons/${name}.jpeg`,   // Try JPEG as fallback
          `/icons/${name}`,        // No extension fallback
        ]
      } else if (name === 'duwaq') {
        // duwaq is JPG, so try JPG first since WebP doesn't exist
        primarySrc = `/icons/${name}.jpg`
        fallbacks = [
          `/icons/${name}.webp`,   // Try WebP as fallback
          `/icons/${name}.png`,    // Try PNG as fallback
          `/icons/${name}.jpeg`,   // Try JPEG as fallback
          `/icons/${name}`,        // No extension fallback
        ]
      } else {
        // Other images are PNG, so try WebP first, then PNG
        primarySrc = `/icons/${name}.webp`
        fallbacks = [
          `/icons/${name}.png`,    // Try PNG as fallback
          `/icons/${name}.jpg`,    // Try JPG as fallback
          `/icons/${name}.jpeg`,   // Try JPEG as fallback
          `/icons/${name}`,        // No extension fallback
        ]
      }
      
      return {
        src: primarySrc,
        fallbacks: fallbacks,
        alt: name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        name: name
      }
    })
  }

  const images = createImageLoader()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [images.length])

  return (
    <>
      {/* Redirect Animation */}
      <RedirectAnimation {...animationProps} />
      
      <section className="relative h-[70vh] sm:h-[80vh] md:h-screen overflow-hidden">
      {/* Background Image Carousel */}
      {images.map((image, index) => {
        return (
          <motion.div
            key={image.src}
            initial={{ x: '100%' }}
            animate={{
              x: index === currentImageIndex ? 0 : index < currentImageIndex ? '-100%' : '100%',
              opacity: index === currentImageIndex ? 1 : 0
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <NextImage 
              src={image.src} 
              alt={image.alt} 
              fill
              className="object-cover"
              priority={index === 0}
              loading={index === 0 ? "eager" : "lazy"}
              sizes="100vw"
              quality={85}
              onError={(e) => {
                console.log(`Image failed to load: ${image.src} for ${image.name}`)
                // Don't try to manipulate the image source in onError
                // This can cause issues with Next.js Image component
              }}
              onLoad={() => console.log(`✅ Successfully loaded: ${image.src} for ${image.name}`)}
            />
          </motion.div>
        )
      })}



      {/* Content Overlay */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6"
          >
            Find Your Dream Home
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 text-white/90"
          >
            Discover luxury properties in the most desirable locations
          </motion.p>
          
          {/* Mobile Agent Dashboard Button */}
          {isAuthenticated && user?.role === 'agent' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="sm:hidden"
            >
              <Button 
                onClick={handleAgentDashboardClick}
                variant="secondary" 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full shadow-2xl border-0 transition-all duration-300 hover:scale-105"
              >
                <User className="w-5 h-5 mr-2" />
                Agent Dashboard
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </section>
    </>
  )
}

export default Hero
