'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bed, Bath, MapPin, Heart, ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PropertyImageWithWatermark } from '@/components/ui/PropertyImageWithWatermark'
import { ResponsivePropertyImage } from '@/components/ui/ResponsivePropertyImage'
import { AdaptivePropertyImage } from '@/components/ui/AdaptivePropertyImage'
import { cn, formatPrice, formatPhoneNumber, capitalizeName, DEFAULT_AVATAR_URL } from '@/lib/utils'
import { getPrimaryImageUrl } from '@/lib/imageUrlResolver'

interface PropertyRecommendationsProps {
  currentProperty: {
    _id?: string
    propertyId?: number
    district: string
  }
  onPropertyClick: (property: any) => void
}

interface RecommendedProperty {
  _id: string
  propertyId?: number
  title: string
  location: string
  district: string
  price: number
  beds: number
  baths: number
  yearBuilt: number
  lotSize: number
  propertyType: string
  status: string
  description: string
  features: string[]
  amenities: string[]
  thumbnailImage: string
  images: string[]
  agentId: string
  agent: {
    name: string
    phone: string
    image: string
    rating: number
  }
  featured: boolean
  viewCount?: number
  createdAt: string
}

// Helper function to translate property status to Somali
const translateStatus = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'for sale':
    case 'for-sale':
      return 'Waa-iib'
    case 'for rent':
    case 'for-rent':
      return 'Waa Kiro'
    case 'sold':
      return 'La iibiyay'
    case 'rented':
      return 'La kireeyay'
    default:
      return status || 'Waa-iib'
  }
}

export const PropertyRecommendations: React.FC<PropertyRecommendationsProps> = ({
  currentProperty,
  onPropertyClick
}) => {
  const [recommendations, setRecommendations] = useState<RecommendedProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecommendations = async () => {
      console.log('🔍 PropertyRecommendations: Starting fetch for district:', currentProperty.district)
      
      if (!currentProperty.district) {
        console.log('❌ PropertyRecommendations: No district provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const excludeId = currentProperty._id || currentProperty.propertyId
        const params = new URLSearchParams({
          district: currentProperty.district,
          limit: '6'
        })

        if (excludeId) {
          params.append('excludeId', String(excludeId))
        }

        console.log('🔍 PropertyRecommendations: Fetching from API with params:', params.toString())
        const response = await fetch(`/api/properties/similar?${params}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch recommendations: ${response.status}`)
        }

        const data = await response.json()
        console.log('✅ PropertyRecommendations: Received data:', data)
        console.log('🔍 PropertyRecommendations: Sample property data:', data.properties?.[0])
        setRecommendations(data.properties || [])
      } catch (err) {
        console.error('❌ PropertyRecommendations: Error fetching recommendations:', err)
        setError('Failed to load recommendations')
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [currentProperty.district, currentProperty._id, currentProperty.propertyId])

  // Helper function to get property image using resolver
  const getPropertyImage = (property: RecommendedProperty) => {
    const imageUrl = getPrimaryImageUrl(property)
    
    // Debug logging for all properties
    console.log('🔍 PropertyRecommendations: Image resolution for property:', {
      propertyId: property._id,
      title: property.title,
      thumbnailImage: property.thumbnailImage,
      images: property.images,
      hasThumbnail: !!property.thumbnailImage,
      hasImages: !!(property.images && property.images.length > 0),
      resolvedImageUrl: imageUrl
    })
    
    return imageUrl
  }

  // Helper function to get property key
  const getPropertyKey = (property: RecommendedProperty, index: number) => {
    return property._id || property.propertyId || index
  }

  if (loading) {
    return (
      <div className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading similar properties...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || recommendations.length === 0) {
    return null // Don't show anything if no recommendations
  }

  return (
    <div className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Guryaha iyo dhulalka kale ee degmada <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent font-extrabold">{currentProperty.district}</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Discover other amazing properties in the same district that might interest you
          </p>
        </motion.div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recommendations.map((property, index) => (
            <motion.div
              key={getPropertyKey(property, index)}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div 
                className="relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2"
                onClick={() => onPropertyClick(property)}
              >
                {/* Image Section */}
                <div className="relative min-h-[240px] md:min-h-[320px] max-h-[400px] overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  {getPropertyImage(property) ? (
                    <AdaptivePropertyImage
                      property={property}
                      alt={property.title}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-700"
                      showWatermark={true}
                      watermarkPosition="center"
                      watermarkSize="medium"
                      sizingMode="adaptive"
                      onError={(error) => {
                        console.warn('Property recommendation image error:', error)
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                      <div className="w-24 h-24 mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-center px-4">No Image Available</p>
                    </div>
                  )}
                  
                  {/* Overlay Elements */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-sm text-slate-800 px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                      {translateStatus(property.status)}
                    </div>
                    <div className="bg-blue-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                      ID: {property.propertyId || property._id || 'N/A'}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4">
                    <button 
                      className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 shadow-lg group/btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle favorite logic
                      }}
                    >
                      <Heart className="w-4 h-4 text-slate-600 group-hover/btn:text-red-500 transition-colors duration-300" />
                    </button>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-300 mb-2">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-slate-600 mb-2">
                      <img 
                        src="/icons/location.gif" 
                        alt="Location" 
                        className="w-4 h-4 mr-2 object-contain"
                      />
                      <span className="text-sm">{property.location}</span>
                    </div>
                    <div className="flex items-center text-slate-500 mb-3">
                      <MapPin className="w-4 h-4 mr-2 text-green-500" />
                      <span className="text-sm font-medium">{property.district}</span>
                    </div>
                    
                    {/* Price Display */}
                    <div className="mb-4">
                      <div 
                        className="text-2xl font-bold text-green-600"
                        dangerouslySetInnerHTML={{ __html: formatPrice(property.price, property.status === 'For Rent' ? 'rent' : 'sale') }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Bedrooms */}
                    <div className="text-center group/stat">
                      <div className="w-12 h-12 flex items-center justify-center mx-auto mb-2 group-hover/stat:scale-110 transition-transform duration-300">
                        <img 
                          src="/icons/bed.png" 
                          alt="Bed" 
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                      <div className="text-lg font-bold text-slate-900 mb-1">{property.beds}</div>
                      <div className="text-slate-600 text-xs font-medium">Qol</div>
                    </div>
                    
                    {/* Bathrooms */}
                    <div className="text-center group/stat">
                      <div className="w-12 h-12 flex items-center justify-center mx-auto mb-2 group-hover/stat:scale-110 transition-transform duration-300">
                        <video 
                          src="/icons/shower1.mp4" 
                          autoPlay 
                          loop 
                          muted 
                          playsInline
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                      <div className="text-lg font-bold text-slate-900 mb-1">{property.baths}</div>
                      <div className="text-slate-600 text-xs font-medium">Suuli</div>
                    </div>
                  </div>

                  {/* Agent Preview */}
                  <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl mb-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={property.agent?.image || DEFAULT_AVATAR_URL}
                        alt={capitalizeName(property.agent?.name || 'Agent')}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = DEFAULT_AVATAR_URL;
                        }}
                      />
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">
                          {capitalizeName(property.agent?.name || 'Agent')}
                        </div>
                        <div className="text-xs text-slate-500">
                          {property.agent?.phone ? formatPhoneNumber(property.agent.phone) : 'Contact Agent'}
                        </div>
                        {/* Debug info */}
                        {console.log('🔍 PropertyRecommendations: Agent data for property:', {
                          propertyId: property._id,
                          title: property.title,
                          agent: property.agent,
                          agentId: property.agentId
                        })}
                      </div>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <Button 
                    variant="primary" 
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button 
              variant="outline"
              size="lg"
              className="bg-white hover:bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300 font-semibold px-8 py-3 rounded-xl"
              onClick={() => {
                // Close current property detail modal
                const closeEvent = new CustomEvent('closePropertyDetail')
                window.dispatchEvent(closeEvent)
                
                // Navigate to properties page with district filter
                setTimeout(() => {
                  window.location.href = `/properties?district=${encodeURIComponent(currentProperty.district)}`
                }, 100)
              }}
            >
              <span className="text-green-600 font-extrabold">Dhammaan</span> <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent font-extrabold ml-2">{currentProperty.district}</span>
              <ExternalLink className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
