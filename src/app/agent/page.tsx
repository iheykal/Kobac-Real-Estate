'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@/contexts/UserContext'
import { uploadToR2, uploadMultipleToR2 } from '@/lib/r2-upload'
import { formatPrice, handlePriceInputChange, parsePriceFromInput } from '@/lib/utils'
import { propertyEventManager } from '@/lib/propertyEvents'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Home, 
  Upload, 
  Eye, 
  DollarSign, 
  Bed, 
  Bath, 
  LogOut,
  User,
  Settings,
  RefreshCw,
  Star,
  X
} from 'lucide-react'

interface Property {
  id: string
  title: string
  propertyType: string
  listingType: string
  measurement?: string
  status: string
  description: string
  price: string
  location: string
  district: string
  bedrooms: string
  bathrooms: string
  images: string[]
  createdAt: string
  viewCount?: number
  deletionStatus?: string // Added for deletion status
}

interface UserData {
  id: string
  fullName: string
  phone: string
  role: string
  status: string
  avatar?: string
  licenseNumber?: string
}

export default function AgentDashboard() {
  console.log('🔍 Agent Dashboard: Component rendering...')
  
  const router = useRouter()
  const { user: contextUser, isAuthenticated, isLoading: contextLoading, logout, validateSession } = useUser()
  
  console.log('🔍 Agent Dashboard: UserContext state:', {
    contextUser: contextUser ? { id: contextUser.id, role: contextUser.role } : null,
    isAuthenticated,
    contextLoading
  })
  
  const [user, setUser] = useState<UserData | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [totalViews, setTotalViews] = useState(0)
  const [viewMode, setViewMode] = useState<'current' | 'cumulative'>('cumulative')
  const [propertyData, setPropertyData] = useState({
    title: '',
    propertyType: 'villa',
    listingType: 'sale',
    measurement: '',
    description: '',
    price: '',
    location: '',
    district: '',
    bedrooms: '',
    bathrooms: '',
    thumbnailImage: null as File | null,
    additionalImages: [] as File[]
  })
  const [uploadingImages, setUploadingImages] = useState(false)
  const [editData, setEditData] = useState({
    id: '',
    title: '',
    description: ''
  })
  // Removed authChecked state - now using UserContext

  useEffect(() => {
    console.log('🔍 Agent Dashboard: useEffect triggered', {
      contextLoading,
      isAuthenticated,
      contextUser: contextUser ? { id: contextUser.id, role: contextUser.role } : null
    })
    
    // Wait for UserContext to finish loading
    if (contextLoading) {
      console.log('🔍 Agent Dashboard: Still loading context...')
      return
    }
    
    // If not authenticated, show error
    if (!isAuthenticated || !contextUser) {
      console.log('🔍 Agent Dashboard: Not authenticated')
      setError('You need to be logged in to access the agent dashboard.')
      setLoading(false)
      return
    }
    
    // Check if user has agent role or is SuperAdmin
    if (contextUser.role !== 'agent' && contextUser.role !== 'agency' && contextUser.role !== 'superadmin') {
      console.log('🔍 Agent Dashboard: Access denied for role:', contextUser.role)
      setError(`Access denied: Your role "${contextUser.role}" does not have permission to access the agent dashboard.`)
      setLoading(false)
      return
    }
    
    console.log('🔍 Agent Dashboard: User authenticated with correct role:', contextUser.role)
    
    // User is authenticated and has correct role
    setUser({
      id: contextUser.id,
      fullName: contextUser.firstName + ' ' + contextUser.lastName,
      phone: contextUser.phone,
      role: contextUser.role || 'user',
      status: 'active',
      avatar: contextUser.avatar
    })
    
    console.log('🔍 Agent Dashboard: Fetching properties for user:', contextUser.id)
    
    // Fetch properties for the user
    fetchAgentProperties(contextUser.id)
    // Fetch agent's total views
    fetchAgentTotalViews(contextUser.id)
    
    // Set a fallback timeout to ensure loading doesn't hang forever
    const fallbackTimeout = setTimeout(() => {
      console.log('🔍 Agent Dashboard: Fallback timeout triggered - setting loading to false')
      setLoading(false)
    }, 15000) // 15 second fallback
    
    // Clear timeout when component unmounts or when loading is set to false
    return () => clearTimeout(fallbackTimeout)
  }, [contextUser, isAuthenticated, contextLoading]) // Depend on UserContext state

  // Removed checkAuth function - now using UserContext for authentication

  const fetchAgentProperties = async (agentId: string) => {
    try {
      console.log('🔍 Agent Dashboard: Starting fetchAgentProperties for agentId:', agentId)
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(`/api/properties?agentId=${agentId}`, {
        credentials: 'include',
        headers: {
          'x-agent-dashboard': 'true' // This tells the API this is an agent dashboard request
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log('🔍 Agent Dashboard: Properties API response status:', response.status)
      
      const result = await response.json()
      console.log('🔍 Agent Dashboard: Properties API response data:', {
        status: response.status,
        ok: response.ok,
        result: result,
        dataLength: result.data?.length || 0
      })
      
      if (response.ok) {
        // Map backend field names to frontend display names - hide pending deletions from agent view
        const mappedProperties = (result.data || [])
          .filter((property: any) => {
            const isVisible = property.deletionStatus !== 'pending_deletion' && 
                             property.deletionStatus !== 'deleted'
            console.log('🔍 Property visibility check:', {
              propertyId: property._id || property.propertyId,
              title: property.title,
              deletionStatus: property.deletionStatus,
              isVisible: isVisible
            })
            return isVisible
          })
          .map((property: any) => ({
            ...property,
            id: property._id || property.propertyId || property.id, // Ensure id field exists
            bedrooms: property.beds?.toString() || '0',
            bathrooms: property.baths?.toString() || '0',
            area: property.sqft?.toString() || '0'
          }))
        
        console.log('🔍 Mapped properties:', {
          total: mappedProperties.length,
          properties: mappedProperties.map((p: any) => ({
            id: p.id,
            title: p.title,
            deletionStatus: p.deletionStatus
          }))
        })
        
        setProperties(mappedProperties)
        setError(null) // Clear any previous errors
      } else {
        console.error('❌ Failed to fetch agent properties:', result.error)
        setError(`Failed to fetch properties: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Agent Dashboard: Error fetching agent properties:', error)
      
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Request timed out. Please try again.')
      } else {
        setError(`Error fetching properties: ${error}`)
      }
    } finally {
      console.log('🔍 Agent Dashboard: Setting loading to false')
      setLoading(false)
    }
  }

  const fetchAgentTotalViews = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agent/total-views?agentId=${agentId}`, {
        credentials: 'include'
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setTotalViews(result.data.totalViews || 0);
      } else {
        // Fallback to calculating from current properties
        setTotalViews(properties.reduce((total, property) => total + (property.viewCount || 0), 0));
      }
    } catch (error) {
      // Fallback to calculating from current properties
      setTotalViews(properties.reduce((total, property) => total + (property.viewCount || 0), 0));
    }
  };

  // Calculate current views from active properties
  const getCurrentViews = () => {
    return properties.reduce((total, property) => total + (property.viewCount || 0), 0);
  };

  // Get the appropriate view count based on toggle mode
  const getDisplayViews = () => {
    return viewMode === 'cumulative' ? totalViews : getCurrentViews();
  };

      const handleUploadProperty = async () => {
      if (!user || !propertyData.propertyType || !propertyData.description || !propertyData.district) {
        alert('Please fill in all required fields including district')
        return
      }
      
      // Validate price
      const parsedPrice = parsePriceFromInput(propertyData.price)
      if (!parsedPrice || parsedPrice <= 0) {
        alert('Please enter a valid price')
        return
      }
      
      // Check authentication before proceeding
      if (!isAuthenticated) {
        alert('You must be logged in to upload properties. Please log in again.')
        logout();
        return;
      }
      
      console.log('🔍 Pre-upload authentication check:', {
        user: user,
        isAuthenticated: isAuthenticated,
        userRole: user?.role
      });
      
      if (propertyData.listingType === 'sale' && !propertyData.measurement) {
        alert('Please enter the measurement (Cabirka) for sale properties')
        return
      }

    try {
      setUploadingImages(true)
      
      // Upload images to R2 first
      let imageUrls: string[] = []
      
      // Combine thumbnail and additional images
      const allImages: File[] = []
      if (propertyData.thumbnailImage) {
        allImages.push(propertyData.thumbnailImage)
      }
      allImages.push(...propertyData.additionalImages)
      
      if (allImages.length > 0) {
        try {
          const uploadResults = await uploadMultipleToR2(allImages)
          imageUrls = uploadResults.map(result => result.url)
        } catch (error) {
          // Use fallback images if upload fails
          imageUrls = ['https://picsum.photos/400/300?random=1']
          // Don't return here, continue with fallback images
        }
      } else {
        // Use placeholder image if no images uploaded
        imageUrls = ['https://picsum.photos/400/300?random=1']
      }



      // Prepare the property data in the format expected by the API
      const propertyPayload = {
        title: propertyData.title || propertyData.propertyType, // Use title if available, fallback to propertyType
        propertyType: propertyData.propertyType,
        listingType: propertyData.listingType,
        status: propertyData.listingType === 'sale' ? 'For Sale' : 'For Rent', // Auto-set status based on listing type
        measurement: propertyData.measurement,
        description: propertyData.description,
        price: parsePriceFromInput(propertyData.price), // Parse formatted price to number
        location: propertyData.location,
        district: propertyData.district,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        thumbnailImage: imageUrls[0] || 'https://picsum.photos/400/300?random=1',
        additionalImages: imageUrls.slice(1) || [],
        agentName: user.fullName || 'Agent',
        agentPhone: user.phone || ''
      }
      
      console.log('🔍 Property payload being sent to API:', {
        payload: propertyPayload,
        validation: {
          hasTitle: !!propertyPayload.title,
          hasPropertyType: !!propertyPayload.propertyType,
          hasDescription: !!propertyPayload.description,
          hasPrice: !!propertyPayload.price,
          hasLocation: !!propertyPayload.location,
          hasDistrict: !!propertyPayload.district,
          hasBedrooms: !!propertyPayload.bedrooms,
          hasBathrooms: !!propertyPayload.bathrooms,
          hasStatus: !!propertyPayload.status
        }
      })

      console.log('🔍 Agent dashboard payload debug:', {
        listingType: propertyData.listingType,
        status: propertyPayload.status,
        statusType: typeof propertyPayload.status,
        fullPayload: propertyPayload,
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone
        }
      });

      // Add a small delay to ensure session is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(propertyPayload)
      })
      
      // Debug session issue
      if (response.status === 401) {
        console.error('🔍 401 Unauthorized - Session issue detected');
        console.error('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
        console.error('🔍 Current user:', user);
        console.error('🔍 Is authenticated:', isAuthenticated);
        
        // Try to refresh the session
        console.log('🔄 Attempting to refresh session...');
        const sessionValid = await validateSession();
        if (sessionValid) {
          console.log('✅ Session refresh successful');
          // Retry the property upload
          const retryResponse = await fetch('/api/properties', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(propertyPayload)
          });
          
          if (retryResponse.ok) {
            const retryResult = await retryResponse.json();
            console.log('✅ Property upload successful after session refresh');
            alert('Property uploaded successfully!')
            setShowUploadModal(false)
            setPropertyData({
              title: '',
              propertyType: 'villa',
              listingType: 'sale',
              measurement: '',
              description: '',
              price: '',
              location: '',
              district: '',
              bedrooms: '',
              bathrooms: '',
              thumbnailImage: null,
              additionalImages: []
            })
            
            // Force refresh properties immediately
            console.log('🔄 Refreshing agent properties after successful upload...')
            await fetchAgentProperties(user.id)
            
            // Re-fetch total views after successful upload
            fetchAgentTotalViews(user.id)
            
            // Notify other components about the new property
            if (retryResult.data && retryResult.data._id) {
              console.log('🔔 Notifying other components about new property:', retryResult.data._id)
              propertyEventManager.notifyAdded(retryResult.data._id)
            }
            return;
          } else {
            console.error('❌ Property upload still failed after session refresh');
            const retryResult = await retryResponse.json();
            alert(`Failed to upload property after session refresh: ${retryResult.error || 'Unknown error'}`)
            return;
          }
        } else {
          console.error('❌ Session refresh failed');
          alert('Session expired. Please log in again.')
          logout();
          return;
        }
      }
      
      const result = await response.json()
      console.log('🔍 Property creation response:', {
        status: response.status,
        ok: response.ok,
        result: result
      })
      
      if (response.ok) {
        alert('Property uploaded successfully!')
        setShowUploadModal(false)
        setPropertyData({
          title: '',
          propertyType: 'villa',
          listingType: 'sale',
          measurement: '',
          description: '',
          price: '',
          location: '',
          district: '',
          bedrooms: '',
          bathrooms: '',
          thumbnailImage: null,
          additionalImages: []
        })
        
        // Force refresh properties immediately
        console.log('🔄 Refreshing agent properties after successful upload...')
        await fetchAgentProperties(user.id)
        
        // Re-fetch total views after successful upload
        fetchAgentTotalViews(user.id)
        
        // Notify other components about the new property
        if (result.data && result.data._id) {
          console.log('🔔 Notifying other components about new property:', result.data._id)
          propertyEventManager.notifyAdded(result.data._id)
        }
      } else {
        console.error('❌ Property creation failed:', result)
        alert(`Failed to upload property: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      alert('Error uploading property')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleEditProperty = async () => {
    if (!editData.title || !editData.description) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch(`/api/properties/${editData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editData.title,
          description: editData.description
        })
      })

      const result = await response.json()
      if (response.ok) {
        alert('Property updated successfully!')
        setShowEditModal(false)
        setEditData({ id: '', title: '', description: '' })
        fetchAgentProperties(user!.id)
        // Re-fetch total views after successful edit
        fetchAgentTotalViews(user!.id)
        // Notify other components about the property update
        propertyEventManager.notifyUpdated(editData.id)
      } else {
        alert(result?.error || 'Failed to update property')
      }
    } catch (error) {
      alert('Error updating property')
    }
  }

  const handleDeleteProperty = async () => {
    if (!editData.id) {
      alert('No property selected for deletion')
      return
    }

    if (!confirm('Are you sure you want to request deletion of this property? It will be immediately hidden from your dashboard and public view, then reviewed by admin for permanent deletion.')) {
      return
    }

    try {
      const response = await fetch(`/api/properties/${editData.id}/request-deletion`, {
        method: 'POST',
        credentials: 'include'
      })

      const result = await response.json()
      if (response.ok) {
        alert('Property deletion requested successfully! It has been hidden from your dashboard and public view, and will be reviewed by admin.')
        setShowDeleteModal(false)
        setEditData({ id: '', title: '', description: '' })
        fetchAgentProperties(user!.id)
        // Re-fetch total views after successful deletion request
        fetchAgentTotalViews(user!.id)
        // Notify other components about the property deletion
        propertyEventManager.notifyDeleted(editData.id)
      } else {
        alert(result?.error || 'Failed to request property deletion')
      }
    } catch (error) {
      alert('Error requesting property deletion')
    }
  }

  const handleLogout = async () => {
    try {
      // Use the UserContext logout function to ensure consistency
      logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: redirect anyway
      router.push('/')
    }
  }

  // Don't render anything until authentication check is complete
  if (loading || contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we verify your credentials</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <User className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <a
                href="/"
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Go to Homepage & Login
              </a>
              <button
                onClick={() => {
                  window.location.reload()
                }}
                className="block w-full px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <User className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Agent Dashboard Access</h1>
            <p className="text-gray-600 mb-6">You need to be logged in as an agent to access the dashboard.</p>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold mb-2">To access the agent dashboard:</p>
                <ol className="text-left space-y-1">
                  <li>1. Sign up for an account</li>
                  <li>2. Contact support to be promoted to agent</li>
                  <li>3. Log in with your credentials</li>
                </ol>
              </div>
              
              <div className="space-y-3">
                <a
                  href="/test-auth"
                  className="block w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Test Authentication
                </a>
                <a
                  href="/"
                  className="block w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  Go to Homepage & Login
                </a>
                <button
                  onClick={() => {
                    console.log('🔄 Retry authentication...')
                    window.location.reload()
                  }}
                  className="block w-full px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Final check - only render dashboard if we have a user and are not loading
  if (!user || loading) {
    return null
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                <Home className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Agent Dashboard
                </h1>
                <p className="text-sm text-gray-600">Manage your properties</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-gray-700 text-sm font-semibold">
                      {user?.fullName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                  <p className="text-xs text-gray-500">Agent</p>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/agent/profile')}
                className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                title="Manage Profile"
              >
                <User className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your properties and profile</p>
            {/* Property Count Display */}
            <div className="mt-4 p-3 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-lg">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{properties.length}</div>
                  <div className="text-sm text-gray-600">Total Properties</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{getDisplayViews()}</div>
                  <div className="text-sm text-gray-600">
                    {viewMode === 'cumulative' ? 'Total Views' : 'Current Views'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* SuperAdmin Navigation */}
          {user?.role === 'superadmin' && (
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin/agents')}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                👑 SuperAdmin Dashboard
              </button>
              <button
                onClick={() => router.push('/agent/profile')}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                👤 Profile
              </button>
            </div>
          )}
          
          {/* Regular Agent Navigation */}
          {user?.role !== 'superadmin' && (
            <button
              onClick={() => router.push('/agent/profile')}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              👤 Profile
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg relative"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
            <button
              onClick={() => setError(null)}
              className="absolute top-0 right-0 p-3 text-red-800 hover:text-red-600"
            >
              ×
            </button>
          </motion.div>
        )}



        {/* Modern Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
        >
          {/* Total Properties Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-6 border border-blue-200/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors duration-300">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{properties.length}</p>
                  <p className="text-sm font-medium text-blue-600">Properties</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Total listings</p>
            </div>
          </div>

          {/* Active Listings Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-100 rounded-3xl p-6 border border-emerald-200/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors duration-300">
                  <Eye className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{properties.length}</p>
                  <p className="text-sm font-medium text-emerald-600">Active</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Current listings</p>
            </div>
          </div>

          {/* Total Views Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-violet-100 rounded-3xl p-6 border border-purple-200/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors duration-300">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{getDisplayViews().toLocaleString()}</p>
                  <p className="text-sm font-medium text-purple-600">Views</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Total views</p>
                <button
                  onClick={() => setViewMode(viewMode === 'current' ? 'cumulative' : 'current')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    viewMode === 'cumulative' ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      viewMode === 'cumulative' ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Performance Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl p-6 border border-amber-200/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors duration-300">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {properties.length > 0 ? Math.round(getDisplayViews() / properties.length) : 0}
                  </p>
                  <p className="text-sm font-medium text-amber-600">Avg Views</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Per property</p>
            </div>
          </div>
        </motion.div>

        {/* Modern Action Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Property Management</h2>
              <p className="text-gray-600">Manage your real estate listings and track performance</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => fetchAgentProperties(user!.id)}
                className="group relative px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 flex items-center space-x-2 shadow-sm hover:shadow-md"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-medium">Refresh</span>
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-500/25 flex items-center space-x-3 transform hover:scale-105"
              >
                <div className="p-1 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors duration-300">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="font-semibold">Add New Property</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Modern Properties Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {properties.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <Home className="w-12 h-12 text-blue-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Properties Yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">Start building your real estate portfolio by adding your first property listing</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-500/25 flex items-center space-x-3 transform hover:scale-105 mx-auto"
              >
                <div className="p-1 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors duration-300">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="font-semibold">Add Your First Property</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              <AnimatePresence>
                {properties.map((property, index) => (
                  <motion.div
                    key={property.id || `property-${index}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    className="group relative bg-white rounded-3xl border border-gray-200/50 shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 overflow-hidden"
                  >
                    {/* Property Image */}
                    <div className="relative h-56 overflow-hidden">
                      {property.images && property.images.length > 0 && property.images[0] ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://picsum.photos/400/300?random=1';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <Home className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Price Badge */}
                      <div className="absolute top-4 right-4">
                        <div 
                          className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-2xl text-sm font-bold text-gray-900 shadow-lg"
                          dangerouslySetInnerHTML={{ __html: formatPrice(parseFloat(property.price) || 0, property.listingType) }}
                        />
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                          property.listingType === 'rent' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {property.listingType === 'rent' ? 'Kiro' : 'Iib'}
                        </span>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Property Content */}
                    <div className="p-6">
                      {/* Title and Location */}
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors duration-300">
                          {property.title}
                        </h3>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <img 
                            src="/icons/location.gif" 
                            alt="Location" 
                            className="w-4 h-4 object-contain"
                          />
                          <span className="text-sm">{property.location || 'Location not specified'}</span>
                        </div>
                        <div className="mt-2">
                          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            {property.district || 'District not specified'}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">
                        {property.description}
                      </p>
                      
                      {/* Property Features */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <div className="p-2 rounded-lg bg-blue-50">
                            <Bed className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{property.bedrooms || '0'}</p>
                            <p className="text-xs text-gray-500">Bedrooms</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <div className="p-2 rounded-lg bg-emerald-50">
                            <Bath className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{property.bathrooms || '0'}</p>
                            <p className="text-xs text-gray-500">Bathrooms</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <div className="p-2 rounded-lg bg-purple-50">
                            <Home className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 capitalize">{property.propertyType || 'villa'}</p>
                            <p className="text-xs text-gray-500">Type</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <div className="p-2 rounded-lg bg-amber-50">
                            <Eye className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{property.viewCount || 0}</p>
                            <p className="text-xs text-gray-500">Views</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            setSelectedProperty(property)
                            setEditData({
                              id: property.id,
                              title: property.title,
                              description: property.description
                            })
                            setShowEditModal(true)
                          }}
                          className="flex-1 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all duration-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-md group"
                        >
                          <Edit className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditData({ id: property.id, title: property.title, description: property.description })
                            setShowDeleteModal(true)
                          }}
                          className="flex-1 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all duration-300 bg-red-50 text-red-700 hover:bg-red-100 hover:shadow-md group"
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modern Upload Property Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200/50"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    Add New Property
                  </h3>
                  <p className="text-gray-600">Create a new property listing for your portfolio</p>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors duration-300 group"
                >
                  <X className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
                </button>
              </div>
              
              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Property Type *</label>
                  <select
                    value={propertyData.propertyType}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, propertyType: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white hover:border-gray-300"
                  >
                    <option value="villa">Villa</option>
                    <option value="bacweyne">Bacweyne</option>
                    <option value="apartment">Apartment</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Listing Type *</label>
                  <select
                    value={propertyData.listingType}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, listingType: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white hover:border-gray-300"
                  >
                    <option value="sale">Iib (Sale)</option>
                    <option value="rent">Kiro (Rent)</option>
                  </select>
                </div>
                {propertyData.listingType === 'sale' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">Cabirka (Measurement) *</label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        value={propertyData.measurement ? propertyData.measurement.split('X')[0] || '' : ''}
                        onChange={(e) => {
                          const firstValue = e.target.value;
                          const secondValue = propertyData.measurement ? propertyData.measurement.split('X')[1] || '' : '';
                          const formatted = secondValue ? `${firstValue}X${secondValue}` : firstValue;
                          setPropertyData(prev => ({ ...prev, measurement: formatted }));
                        }}
                        placeholder="20"
                        className="w-24 px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-center font-semibold"
                      />
                      <span className="text-gray-500 font-bold text-xl">×</span>
                      <input
                        type="number"
                        value={propertyData.measurement ? propertyData.measurement.split('X')[1] || '' : ''}
                        onChange={(e) => {
                          const secondValue = e.target.value;
                          const firstValue = propertyData.measurement ? propertyData.measurement.split('X')[0] || '' : '';
                          const formatted = firstValue ? `${firstValue}X${secondValue}` : secondValue;
                          setPropertyData(prev => ({ ...prev, measurement: formatted }));
                        }}
                        placeholder="20"
                        className="w-24 px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-center font-semibold"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Enter length and width measurements (e.g., 20 × 20)</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Price *</label>
                  <input
                    type="text"
                    value={propertyData.price}
                    onChange={(e) => handlePriceInputChange(e.target.value, (value) => setPropertyData(prev => ({ ...prev, price: value })))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white hover:border-gray-300 font-semibold"
                    placeholder="Kuqor Qiimaha"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Location</label>
                  <input
                    type="text"
                    value={propertyData.location}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white hover:border-gray-300"
                    placeholder="Enter location"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">District *</label>
                  <select
                    value={propertyData.district}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, district: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white hover:border-gray-300"
                    required
                  >
                    <option value="">Select a district</option>
                    <option value="Abdiaziz">Abdiaziz</option>
                    <option value="Bondhere">Bondhere</option>
                    <option value="Daynile">Daynile</option>
                    <option value="Hamar‑Jajab">Hamar‑Jajab</option>
                    <option value="Hamar‑Weyne">Hamar‑Weyne</option>
                    <option value="Hodan">Hodan</option>
                    <option value="Howl-Wadag">Howl-Wadag</option>
                    <option value="Heliwaa">Heliwaa</option>
                    <option value="Kaxda">Kaxda</option>
                    <option value="Karan">Karan</option>
                    <option value="Shangani">Shangani</option>
                    <option value="Shibis">Shibis</option>
                    <option value="Waberi">Waberi</option>
                    <option value="Wadajir">Wadajir</option>
                    <option value="Warta Nabada (formerly Wardhigley)">Warta Nabada (formerly Wardhigley)</option>
                    <option value="Yaqshid">Yaqshid</option>
                    <option value="Darusalam">Darusalam</option>
                    <option value="Dharkenley">Dharkenley</option>
                    <option value="Garasbaley">Garasbaley</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Bedrooms</label>
                  <input
                    type="number"
                    value={propertyData.bedrooms}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, bedrooms: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white hover:border-gray-300"
                    placeholder="Number of bedrooms"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Bathrooms</label>
                  <input
                    type="number"
                    value={propertyData.bathrooms}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, bathrooms: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white hover:border-gray-300"
                    placeholder="Number of bathrooms"
                  />
                </div>
              </div>
              
              <div className="mt-8">
                <label className="block text-sm font-semibold text-gray-800 mb-3">Description *</label>
                <textarea
                  value={propertyData.description}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, description: e.target.value }))}
                  rows={5}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white hover:border-gray-300 resize-none"
                  placeholder="Enter property description"
                />
              </div>
              
              {/* Modern Image Upload Sections */}
              <div className="mt-10 space-y-8">
                {/* Thumbnail Image Upload */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      🖼️ Thumbnail Image (Main/Featured Image) *
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setPropertyData(prev => ({ ...prev, thumbnailImage: file }))
                        }}
                        className="block w-full text-sm text-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-300"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      💡 This will be the main image displayed in property listings and cards.
                    </p>
                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                      <p className="text-sm text-blue-700">
                        ✨ <strong>Auto-optimized:</strong> Images are automatically converted to WebP format for faster loading and smaller file sizes
                      </p>
                    </div>
                    {propertyData.thumbnailImage && (
                      <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                        <p className="text-sm text-emerald-700 font-medium">
                          ✅ Selected: {propertyData.thumbnailImage.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Images Upload */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      📸 Additional Property Images
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          setPropertyData(prev => ({ ...prev, additionalImages: files }))
                        }}
                        className="block w-full text-sm text-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all duration-300"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      💡 Upload multiple images to showcase different views of the property.
                    </p>
                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                      <p className="text-sm text-blue-700">
                        ✨ <strong>Auto-optimized:</strong> All images are automatically converted to WebP format for faster loading and smaller file sizes
                      </p>
                    </div>
                    {propertyData.additionalImages.length > 0 && (
                      <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                        <p className="text-sm text-emerald-700 font-medium mb-2">
                          ✅ Selected {propertyData.additionalImages.length} additional image(s):
                        </p>
                        <ul className="text-sm text-emerald-600 space-y-1">
                          {propertyData.additionalImages.map((file, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                              <span>{file.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Modern Modal Buttons */}
              <div className="flex justify-end space-x-4 mt-12 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-8 py-4 text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadProperty}
                  disabled={uploadingImages}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg hover:shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 disabled:transform-none"
                >
                  {uploadingImages ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <div className="p-1 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors duration-300">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span>Upload Property</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Property Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Edit Property
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Title *</label>
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter property title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter property description"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditProperty}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium"
                >
                  Update Property
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Property Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Request Property Deletion
              </h3>
              
              <p className="text-gray-600 mb-6">
                This will immediately remove the property from public view and send it to admin for review. The property will be permanently deleted after admin confirmation.
              </p>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProperty}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 font-medium"
                >
                  Request Deletion
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
