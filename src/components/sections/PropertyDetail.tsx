'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { 
  Bed, 
  Bath, 
  MapPin,
  Heart, 
  Share2, 
  Phone, 
  Mail, 
  ArrowLeft,
  ArrowRight,
  Home,
  Calendar,
  Ruler,
  ExternalLink,
  Award,
  Shield,
  Crown
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { PropertyImageWithWatermarkFixed } from '@/components/ui/PropertyImageWithWatermarkFixed'
import EnhancedImageGallery from '@/components/ui/EnhancedImageGallery'
import { PropertyRecommendations } from './PropertyRecommendations'
import { formatPrice, formatPhoneNumber, formatListingDate, capitalizeName, DEFAULT_AVATAR_URL } from '@/lib/utils'
import { getPrimaryImageUrl, getAllImageUrls } from '@/lib/imageUrlResolver'

// Safe agent ID resolver function
function resolveAgentId(property: any): string | number | undefined {
  console.log('🔍 Resolving agent ID for property:', {
    propertyId: property.propertyId || property._id,
    agentId: property.agentId,
    agent: property.agent,
    agentKeys: property.agent ? Object.keys(property.agent) : 'no agent object'
  });
  
  // Try all possible ID fields in order of preference
  const possibleIds = [
    property.agentId, // Top-level agentId
    property.agent?.id, // agent.id
    property.agent?._id, // agent._id
    property.agent?.agentId, // agent.agentId
    property.agent?.userId, // agent.userId
    (property.agent as any)?.['user_id'], // agent.user_id
    (property.agent as any)?.['agent_id'] // agent.agent_id
  ];
  
  // Find the first valid ID
  for (const id of possibleIds) {
    console.log('🔍 Checking possible ID:', id, 'type:', typeof id);
    if (id && (typeof id === 'string' || typeof id === 'number')) {
      console.log('✅ Found valid agent ID:', id);
      return String(id); // Ensure it's a string
    }
  }
  
  // If agentId is an object (populated reference), extract the ID
  if (property.agentId && typeof property.agentId === 'object' && property.agentId !== null) {
    const objectId = (property.agentId as any)._id || (property.agentId as any).id;
    if (objectId) {
      console.log('✅ Found agent ID from populated object:', objectId);
      return String(objectId);
    }
  }
  
  // Special case: If we have agentId but no real user exists, use the agentId anyway
  // This handles cases where properties have agentId but the user was deleted
  if (property.agentId && typeof property.agentId === 'string' && property.agentId.length > 0) {
    console.log('✅ Found agent ID string (may not exist in users):', property.agentId);
    return String(property.agentId);
  }
  
  // If agent is an object with nested ID fields
  if (property.agent && typeof property.agent === 'object') {
    // Check for nested ID fields (only if they exist)
    const nestedIds = [
      (property.agent as any)._id,
      (property.agent as any).id,
      (property.agent as any).agentId,
      (property.agent as any).userId
    ];
    
    for (const id of nestedIds) {
      if (id && (typeof id === 'string' || typeof id === 'number')) {
        console.log('✅ Found agent ID from nested object:', id);
        return String(id);
      }
    }
  }
  
  console.log('❌ No valid agent ID found');
  console.log('🔍 Final check - property.agentId:', property.agentId, 'type:', typeof property.agentId);
  console.log('🔍 Final check - property.agent:', property.agent);
  
  // Last resort: if we have any agentId at all, use it
  if (property.agentId && String(property.agentId).length > 0) {
    console.log('✅ Using agentId as last resort:', property.agentId);
    return String(property.agentId);
  }
  
  return undefined;
}

interface PropertyDetailProps {
  property: {
    id?: number
    _id?: string
    propertyId?: number
    title: string
    location: string
    district?: string
    price: number
    beds: number
    baths: number
    yearBuilt: number
    lotSize: number
    propertyType: string
    status: string
    description: string
    documentType?: string
    measurement?: string
    features: string[]
    amenities: string[]
    thumbnailImage?: string
    images: string[]
    agentId?: string | { _id?: string; id?: string }
    createdAt?: string | Date
    agent: {
      id?: string
      name: string
      phone: string
      email: string
      image: string
      rating: number
      verified?: boolean
    }
  }
  onClose: () => void
}

export const PropertyDetail: React.FC<PropertyDetailProps> = ({ property, onClose }) => {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState(0)
  
  // Get all image URLs and log debug info
  const allImageUrls = React.useMemo(() => {
    const urls = getAllImageUrls(property);
    console.log('🖼️ PropertyDetail v2.1: Property image data:', {
      propertyId: property.propertyId || property._id,
      title: property.title,
      thumbnailImage: property.thumbnailImage,
      images: property.images,
      imagesLength: property.images?.length,
      allImageUrls: urls,
      allImageUrlsCount: urls.length,
      thumbnailInImages: property.thumbnailImage ? property.images?.includes(property.thumbnailImage) : false
    });
    return urls;
  }, [property]);
  const [isFavorite, setIsFavorite] = useState(false)
  const [loadingAgentId, setLoadingAgentId] = useState<string | null>(null)

  // Function to get agent's first name
  const getAgentFirstName = () => {
    if (!property.agent?.name) return 'Agent'
    return (property.agent as any).name.split(' ')[0]
  }

  // Increment view count when property detail is opened
  useEffect(() => {
    const incrementViewCount = async () => {
      if (property.propertyId || property._id) {
        try {
          const propertyId = property.propertyId || property._id
          await fetch(`/api/properties/${propertyId}/increment-view`, {
            method: 'POST',
            credentials: 'include'
          })
        } catch (error) {
          // Silent error handling
        }
      }
    }

    incrementViewCount()
  }, [property.propertyId, property._id])

  // Listen for close events from recommendations
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleCloseEvent = () => {
      onClose()
    }

    window.addEventListener('closePropertyDetail', handleCloseEvent)
    
    return () => {
      window.removeEventListener('closePropertyDetail', handleCloseEvent)
    }
  }, [onClose])

  const handleImageChange = (index: number) => {
    setSelectedImage(index)
  }

  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
  }

  const viewAgentSource = useCallback(async () => {
    console.log('🔍 Starting viewAgentSource with property:', {
      propertyId: property.propertyId || property._id,
      agentId: property.agentId,
      agent: property.agent,
      agentName: property.agent?.name,
      agentObjectKeys: property.agent ? Object.keys(property.agent) : 'no agent object',
      agentObjectValues: property.agent ? Object.entries(property.agent) : 'no agent object'
    });
    
    const agentId = resolveAgentId(property);
    
    if (!agentId) {
      console.warn("❌ Agent ID not found in property:", {
        propertyId: property.propertyId || property._id,
        agentId: property.agentId,
        agent: property.agent,
        agentName: property.agent?.name,
        agentObjectKeys: property.agent ? Object.keys(property.agent) : 'no agent object',
        agentObjectValues: property.agent ? Object.entries(property.agent) : 'no agent object'
      });
      
      // Try to find agent by name as fallback
      if (property.agent?.name) {
        try {
          const response = await fetch(`/api/agents/by-name?name=${encodeURIComponent((property.agent as any).name)}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data?.id) {
              console.log('✅ Found agent by name, navigating to:', result.data.id);
              router.push(`/agent/${result.data.id}`);
              onClose();
              return;
            }
          }
        } catch (error) {
          console.error('Error finding agent by name:', error);
        }
      }
      
      // If we have agent data but no ID, create a fallback agent page
      if (property.agent?.name) {
        console.log('🔍 Creating fallback agent page for:', (property.agent as any).name);
        // Create a fallback agent ID based on the name
        const fallbackAgentId = `fallback-${(property.agent as any).name.toLowerCase().replace(/\s+/g, '-')}`;
        router.push(`/agent/${fallbackAgentId}`);
        onClose();
        return;
      }
      
      alert("Agent information is not available for this property.");
      return;
    }
    
    console.log('🔍 Navigating to full agent profile page:', agentId);
    
    // Smart preloading strategy - start with minimal API to warm cache
    const preloadPromises = [
      // First, warm the cache with minimal API
      fetch(`/api/agents/${agentId}/minimal`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      }).then(response => {
        if (response.ok) {
          console.log('🚀 Cache warmed successfully for agent:', agentId)
        }
        return response
      }).catch(() => {}),
      // Then try instant API (should now have cache)
      fetch(`/api/agents/${agentId}/instant`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      }).catch(() => {}),
      // Fallback to main API
      fetch(`/api/agents/${agentId}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      }).catch(() => {})
    ];
    
    // Start navigation immediately
    router.push(`/agent/${agentId}`);
    onClose();
    
    // Let all preloads continue in background
    Promise.allSettled(preloadPromises).then(() => {
      console.log('🚀 All agent data preloaded successfully');
    });
  }, [property, router, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto opacity-0 animate-fadeIn">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 transition-all duration-200 ease-out">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">Property Details</h1>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-110 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 py-8 transition-all duration-300 ease-out">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Side - Enhanced Property Images */}
              <div className="space-y-6">
                <EnhancedImageGallery
                  property={property}
                  className="w-full"
                  showThumbnails={true}
                  showNavigation={true}
                          showWatermark={true}
                          watermarkPosition="center"
                          watermarkSize="large"
                  thumbnailSize="medium"
                  thumbnailLayout="flexible"
                  enableTouchGestures={true}
                  enableKeyboardNavigation={true}
                  maintainAspectRatio={true}
                />
              </div>
              {/* Right Side - Property Details */}
              <div className="space-y-6">
                {/* Title & Price */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-serif font-bold text-slate-900">
                      {property.title}
                    </h1>
                    <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      ID: {property.propertyId || property.id || property._id || 'N/A'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <img 
                      src="/icons/location.gif" 
                      alt="Location" 
                      className="w-5 h-5 object-contain"
                    />
                    <span>{property.location}</span>
                  </div>
                  {property.district && (
                    <div className="flex items-center space-x-2 text-slate-500">
                      <MapPin className="w-5 h-5 text-green-500" />
                      <span className="font-medium">{property.district}</span>
                    </div>
                  )}
                  <div 
                    className="text-4xl font-bold text-green-600"
                    dangerouslySetInnerHTML={{ __html: formatPrice(property.price) }}
                  />
                  {property.createdAt && (
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Calendar className="w-5 h-5" />
                      <span>Lasoo dhigay {formatListingDate(property.createdAt)}</span>
                    </div>
                  )}
                </div>

                {/* Key Stats */}
                <div className={`grid gap-4 ${property.status === 'For Sale' ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  {/* Document Type - Show for all properties */}
                  {property.documentType && (
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                      <div className="w-16 h-16 flex items-center justify-center mx-auto mb-2">
                        <Award className="w-8 h-8 text-purple-600" />
                      </div>
                      <div className="text-lg font-bold text-slate-900">{property.documentType}</div>
                      <div className="text-sm text-slate-600">Sharciga</div>
                    </div>
                  )}
                  
                  {/* Measurement - Only show for properties for sale */}
                  {property.status === 'For Sale' && (
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                      <div className="w-16 h-16 flex items-center justify-center mx-auto mb-2">
                        <img 
                          src="/icons/ruler.gif" 
                          alt="Measurement" 
                          className="w-10 h-10 object-contain mix-blend-multiply"
                          style={{ filter: 'contrast(1.2) brightness(1.1)' }}
                        />
                      </div>
                      <div className="text-xl font-bold text-slate-900">{property.measurement || 'N/A'}</div>
                      <div className="text-sm text-slate-600">Cabbirka</div>
                    </div>
                  )}
                  
                  {/* Beds and Baths - Only show for rent properties with valid values */}
                  {property.status === 'For Rent' && property.beds > 0 && property.baths > 0 && (
                    <>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                        <div className="w-16 h-16 flex items-center justify-center mx-auto mb-2">
                          <img 
                            src="/icons/bed.png" 
                            alt="Bed" 
                            className="w-10 h-10 object-contain"
                          />
                        </div>
                        <div className="text-xl font-bold text-slate-900">{property.beds}</div>
                        <div className="text-sm text-slate-600">Qol</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                        <div className="w-20 h-20 flex items-center justify-center mx-auto mb-2">
                          <video 
                            src="/icons/shower1.mp4" 
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                            className="w-12 h-12 object-contain mix-blend-multiply"
                            style={{ filter: 'contrast(1.2) brightness(1.1)' }}
                          />
                        </div>
                        <div className="text-xl font-bold text-slate-900">{property.baths}</div>
                        <div className="text-sm text-slate-600">Suuli</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <h3 className="text-xl font-serif font-bold text-slate-900">Faah-Faahin</h3>
                  <p className="text-slate-700 leading-relaxed">{property.description}</p>
                </div>

                {/* Agent Card */}
                <motion.div 
                  className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  animate={{
                    boxShadow: [
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                    ]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatDelay: 6
                  }}
                >
                  {/* Header with gradient background */}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <motion.div 
                          className="flex items-center justify-center"
                          animate={{
                            rotate: [0, -5, 5, -5, 0],
                            scale: [1, 1.05, 1, 1.05, 1],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            repeatDelay: 4
                          }}
                        >
                          <img 
                            src="/icons/contactgif.gif" 
                            alt="Contact" 
                            className="w-7 h-7 object-contain"
                          />
                        </motion.div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">
                            LAXIRIIR WAKIILKEENA{' '}
                            <span
                              className="transition-colors underline decoration-white/30 hover:decoration-white/60 bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent font-bold cursor-pointer hover:text-blue-100"
                              onClick={viewAgentSource}
                              title="View agent profile"
                            >
                              {capitalizeName(property.agent?.name || 'Agent')}
                            </span>
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-white text-xs font-bold">👤</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Agent Content */}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <div 
                        className="relative group cursor-pointer"
                        onClick={viewAgentSource}
                        title="View agent profile"
                      >
                        <div className="relative">
                          {/* Decorative outer circle */}
                          <motion.div 
                            className="absolute -inset-2 rounded-full bg-white opacity-70 blur-sm"
                            animate={{
                              rotate: 360,
                              scale: [1, 1.1, 1],
                            }}
                            transition={{
                              rotate: {
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear"
                              },
                              scale: {
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }
                            }}
                          ></motion.div>
                          
                          {/* Main profile circle */}
                          <div className="relative w-20 h-20 rounded-full p-1 transition-all duration-300 bg-white">
                            <img
                              src={property.agent?.image || DEFAULT_AVATAR_URL}
                              alt={capitalizeName(property.agent?.name || 'Agent')}
                              className={`w-full h-full border-2 border-white shadow-md ${(property.agent?.name?.toLowerCase().includes('kobac real estate') || property.agent?.name?.toLowerCase().includes('kobac real')) ? 'rounded-full object-contain' : 'rounded-full object-cover'}`}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = DEFAULT_AVATAR_URL;
                              }}
                            />
                          </div>
                        </div>
                        <div className="absolute -top-1 -right-1 bg-white text-blue-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-nowrap">
                          <div className="flex items-center gap-1 flex-nowrap min-w-0">
                            <h3 
                              className="text-xl font-bold text-slate-800 transition-colors cursor-pointer hover:text-blue-600 whitespace-nowrap"
                              onClick={viewAgentSource}
                              title="View agent profile"
                            >
                              {capitalizeName(property.agent?.name || 'Agent')}
                            </h3>
                            {(property.agent?.name?.toLowerCase().includes('kobac real estate') || 
                              property.agent?.name?.toLowerCase().includes('kobac real')) && (
                              <div className="flex items-center justify-center w-4 h-4 rounded-full shadow-lg border flex-shrink-0" style={{backgroundColor: '#1877F2', borderColor: '#1877F2'}}>
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <span className="text-sm text-slate-500 font-medium">
                            Mogadishu - Somalia
                          </span>
                        </div>

                      </div>
                    </div>
                    
                    {/* Contact Buttons */}
                    <div className="space-y-3">
                      <button 
                        className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 group"
                      >
                        <motion.div
                          animate={{
                            rotate: [0, -3, 3, -3, 0],
                            scale: [1, 1.08, 1, 1.08, 1],
                            filter: [
                              "drop-shadow(0 0 0 rgba(59, 130, 246, 0))",
                              "drop-shadow(0 0 4px rgba(59, 130, 246, 0.3))",
                              "drop-shadow(0 0 0 rgba(59, 130, 246, 0))"
                            ]
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            repeatDelay: 3.5
                          }}
                          className="flex items-center justify-center bg-transparent"
                          style={{ backgroundColor: 'transparent' }}
                        >
                          <img 
                            src="/icons/contactgif.gif" 
                            alt="Contact" 
                            className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                          />
                        </motion.div>
                        <span>{property.agent?.phone ? formatPhoneNumber(property.agent.phone) : 'Contact Agent'}</span>
                      </button>
                      
                      <button 
                        className={`w-full border-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 group ${
                          loadingAgentId 
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50' 
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer'
                        }`}
                        onClick={viewAgentSource}
                        disabled={!!loadingAgentId}
                        title="View agent source information"
                      >
                        <img 
                          src="/icons/profile.gif" 
                          alt="Profile" 
                          className="w-9 h-9 object-contain group-hover:scale-110 transition-transform"
                        />
                        <span>{loadingAgentId ? 'Loading...' : `View Source - ${getAgentFirstName()}`}</span>
                      </button>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t border-green-100">
                      <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span>Available 24/7</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span>Quick Response</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Features and Amenities Section */}
        {(property.features?.length > 0 || property.amenities?.length > 0) && (
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-6 sm:p-8"
              >
                {/* Features Section */}
                {property.features?.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                      <Home className="w-5 h-5 mr-2 text-blue-600" />
                      Property Features
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {property.features.map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                          className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                            <Home className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-xs font-medium text-center">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities Section */}
                {property.amenities?.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                      <Award className="w-5 h-5 mr-2 text-green-600" />
                      Amenities
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {property.amenities.map((amenity, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (property.features?.length || 0) * 0.1 + index * 0.1, duration: 0.3 }}
                          className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                        >
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2">
                            <Award className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-xs font-medium text-center">{amenity}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}

        {/* Property Recommendations */}
        {property.district && (
          <>
            {console.log('🔍 PropertyDetail: Rendering recommendations for district:', property.district)}
            <PropertyRecommendations 
              currentProperty={{
                _id: property._id,
                propertyId: property.propertyId,
                district: property.district
              }}
              onPropertyClick={(recommendedProperty) => {
                // Close current detail and open new one
                onClose()
                // Small delay to allow modal to close before opening new one
                setTimeout(() => {
                  // Trigger the property click event for the recommended property
                  // This will be handled by the parent component
                  if (typeof window !== 'undefined') {
                    const event = new CustomEvent('propertyClick', { 
                      detail: recommendedProperty 
                    })
                    window.dispatchEvent(event)
                  }
                }, 300)
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
