'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, RefreshCw, Home, TestTube } from 'lucide-react'

interface Property {
  _id: string
  propertyId: number
  title: string
  location: string
  district: string
  price: number
  viewCount: number
  createdAt: string
}

export default function DebugViewCountsPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [debugData, setDebugData] = useState<any>(null)

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/properties')
      const result = await response.json()
      
      if (result.success) {
        setProperties(result.data)
      } else {
        setError(result.error || 'Failed to fetch properties')
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      setError('Failed to fetch properties')
    } finally {
      setLoading(false)
    }
  }

  const fetchDebugData = async () => {
    try {
      const response = await fetch('/api/debug-properties')
      const result = await response.json()
      
      if (result.success) {
        setDebugData(result.data)
      }
    } catch (error) {
      console.error('Error fetching debug data:', error)
    }
  }

  const testViewIncrement = async () => {
    try {
      // First get a sample property
      const getResponse = await fetch('/api/test-view-increment')
      const getResult = await getResponse.json()
      
      if (!getResult.success) {
        setTestResult({ error: getResult.error })
        return
      }

      const sampleProperty = getResult.data.sampleProperty
      setTestResult({ 
        step1: `Found sample property: ${sampleProperty.title} (ID: ${sampleProperty.propertyId}, Views: ${sampleProperty.viewCount})` 
      })

      // Now test incrementing
      const postResponse = await fetch('/api/test-view-increment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ propertyId: sampleProperty.propertyId })
      })
      
      const postResult = await postResponse.json()
      
      if (postResult.success) {
        setTestResult((prev: any) => ({
          ...prev,
          step2: `Successfully incremented view count! New count: ${postResult.data.viewCount} (Method: ${postResult.data.method})`
        }))
      } else {
        setTestResult((prev: any) => ({
          ...prev,
          step2: `Failed to increment: ${postResult.error}`
        }))
      }

    } catch (error) {
      console.error('Error testing view increment:', error)
      setTestResult({ error: 'Test failed' })
    }
  }

  const incrementView = async (propertyId: number) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/increment-view`, {
        method: 'POST',
        credentials: 'include'
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('View increment successful:', result)
        // Refresh the properties list to show updated view count
        fetchProperties()
      } else {
        console.error('View increment failed:', result)
      }
    } catch (error) {
      console.error('Error incrementing view:', error)
    }
  }

  useEffect(() => {
    fetchProperties()
    fetchDebugData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <TestTube className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Debug View Counts</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => { fetchProperties(); fetchDebugData(); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <a
                href="/"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            View Count Debugging
          </h2>
          <p className="text-gray-600">
            Debug and test the view count incrementing system
          </p>
        </motion.div>

        {/* Debug Information */}
        {debugData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Database Debug Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{debugData.totalProperties}</p>
                <p className="text-gray-600">Total Properties</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{debugData.viewCountStats?.totalViews || 0}</p>
                <p className="text-gray-600">Total Views</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{debugData.viewCountStats?.avgViews?.toFixed(1) || 0}</p>
                <p className="text-gray-600">Avg Views</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{debugData.viewCountStats?.propertiesWithViews || 0}</p>
                <p className="text-gray-600">Properties with Views</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Test Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Test View Increment</h3>
          <button
            onClick={testViewIncrement}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <TestTube className="w-5 h-5" />
            <span>Run View Increment Test</span>
          </button>
          
          {testResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Test Results:</h4>
              {testResult.step1 && <p className="text-sm text-gray-700 mb-1">{testResult.step1}</p>}
              {testResult.step2 && <p className="text-sm text-gray-700 mb-1">{testResult.step2}</p>}
              {testResult.error && <p className="text-sm text-red-600">{testResult.error}</p>}
            </div>
          )}
        </motion.div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property, index) => (
            <motion.div
              key={property._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                  {property.title}
                </h3>
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">
                    {property.viewCount || 0}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">ID:</span>
                  <span>{property.propertyId}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Location:</span>
                  <span>{property.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Price:</span>
                  <span>${property.price?.toLocaleString()}</span>
                </div>
              </div>
              
              <button
                onClick={() => incrementView(property.propertyId)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Increment View (+1)
              </button>
            </motion.div>
          ))}
        </div>

        {properties.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600">There are no properties to display.</p>
          </div>
        )}
      </div>
    </div>
  )
}
