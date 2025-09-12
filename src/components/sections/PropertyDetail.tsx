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
import FeatureIcon from '@/components/ui/FeatureIcon'

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
                    <MapPin className="w-5 h-5" />
                    <span>{property.location}</span>
                  </div>
                  {property.district && (
                    <div className="flex items-center space-x-2 text-slate-600">
                      <MapPin className="w-5 h-5" />
                      <span>{property.district}</span>
                    </div>
                  )}
                  <div className="text-4xl font-bold text-blue-600">
                    {formatPrice(property.price)}
                  </div>
                </div>

                {/* Property Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Bed className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium">{property.beds} Bedrooms</span>
                      </div>
                  <div className="flex items-center space-x-2">
                    <Bath className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium">{property.baths} Bathrooms</span>
                    </div>
                  <div className="flex items-center space-x-2">
                    <Ruler className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium">{property.measurement || 'N/A'} sq ft</span>
                      </div>
                  <div className="flex items-center space-x-2">
                    <Home className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium">{property.propertyType}</span>
                      </div>
                </div>

                {/* Property Description */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-slate-900">Description</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {property.description || 'No description available for this property.'}
                  </p>
                </div>

                {/* Agent Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-slate-900">Agent Information</h3>
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={property.agent?.image || DEFAULT_AVATAR_URL}
                      alt={property.agent?.name || 'Agent'}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">
                        {property.agent?.name || 'Agent'}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {property.agent?.email || 'No email available'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {property.agent?.phone ? formatPhoneNumber(property.agent.phone) : 'No phone available'}
                      </p>
                    </div>
                    <Button
                              onClick={viewAgentSource}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      View Agent
                    </Button>
                              </div>
                          </div>
                        </div>
                        </div>
                        </div>
                      </div>
      </div>
    </div>
  )
}
