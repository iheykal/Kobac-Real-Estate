'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Property {
  _id: string
  propertyId: number
  title: string
  thumbnailImage?: string
  images: string[]
  price: number
  location: string
}

export default function DebugPropertyImagesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/properties?limit=10')
      const data = await response.json()
      
      if (data.success) {
        setProperties(data.data)
      } else {
        setError(data.error || 'Failed to fetch properties')
      }
    } catch (error) {
      setError('Error fetching properties')
    } finally {
      setLoading(false)
    }
  }

  const checkForUzeLogo = (images: string[]) => {
    return images.filter(img => img && (img.includes('uze.png') || img.includes('/icons/')))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties for debug...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error: {error}</div>
          <button 
            onClick={fetchProperties}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-red-800 mb-2">
              🔍 Property Images Debug
            </h1>
            <p className="text-gray-600">
              Debugging where Uze logo appears in property images
            </p>
          </div>

          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Debug Information:</h2>
            <ul className="text-red-700 space-y-1">
              <li>• Looking for Uze logo in property images arrays</li>
              <li>• Checking thumbnailImage and images fields</li>
              <li>• Total properties loaded: {properties.length}</li>
            </ul>
          </div>

          <div className="space-y-6">
            {properties.map((property, index) => {
              const uzeInThumbnail = property.thumbnailImage && property.thumbnailImage.includes('uze.png')
              const uzeInImages = checkForUzeLogo(property.images)
              const hasUzeLogo = uzeInThumbnail || uzeInImages.length > 0
              
              return (
                <motion.div
                  key={property._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border rounded-lg p-4 ${hasUzeLogo ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{property.title}</h3>
                      <p className="text-gray-600 text-sm">ID: {property.propertyId}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      hasUzeLogo ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                      {hasUzeLogo ? '🚨 HAS UZE LOGO' : '✅ CLEAN'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Thumbnail Image:</h4>
                      <div className={`p-2 rounded ${uzeInThumbnail ? 'bg-red-100' : 'bg-green-100'}`}>
                        <div className="font-mono text-xs break-all">
                          {property.thumbnailImage || 'None'}
                        </div>
                        {uzeInThumbnail && (
                          <div className="text-red-600 text-xs mt-1">🚨 Contains Uze logo!</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Images Array ({property.images.length}):</h4>
                      <div className={`p-2 rounded ${uzeInImages.length > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                        {property.images.length === 0 ? (
                          <div className="text-gray-500">No images</div>
                        ) : (
                          <div className="space-y-1">
                            {property.images.map((img, imgIndex) => (
                              <div key={imgIndex} className="font-mono text-xs break-all">
                                {imgIndex + 1}. {img}
                                {img && img.includes('uze.png') && (
                                  <span className="text-red-600 ml-2">🚨 Uze logo!</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {uzeInImages.length > 0 && (
                          <div className="text-red-600 text-xs mt-2">
                            🚨 Found {uzeInImages.length} Uze logo(s) in images array!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {hasUzeLogo && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                      <h4 className="font-medium text-red-800 mb-2">🚨 ISSUE DETECTED:</h4>
                      <ul className="text-red-700 text-sm space-y-1">
                        {uzeInThumbnail && <li>• Thumbnail image contains Uze logo</li>}
                        {uzeInImages.length > 0 && <li>• Images array contains {uzeInImages.length} Uze logo(s)</li>}
                        <li>• This property will show Uze logo in the image gallery</li>
                        <li>• Need to clean the database or filter out these images</li>
                      </ul>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={fetchProperties}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Refresh Debug Data
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
