'use client'

import { useState, useEffect } from 'react'
import { useProperties } from '@/hooks/useProperties'

export default function DebugPropertiesDisplay() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const { properties, loading, error } = useProperties(false, undefined)

  useEffect(() => {
    setDebugInfo({
      propertiesCount: properties.length,
      loading,
      error,
      properties: properties.map(p => ({
        _id: p._id,
        title: p.title,
        district: p.district,
        location: p.location,
        price: p.price,
        agentId: p.agentId,
        deletionStatus: p.deletionStatus,
        thumbnailImage: (p as any).thumbnailImage,
        images: (p as any).images,
        createdAt: p.createdAt
      }))
    })
  }, [properties, loading, error])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔍 Properties Debug Information
          </h1>
          
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">📊 Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{debugInfo?.propertiesCount || 0}</div>
                  <div className="text-sm text-blue-700">Total Properties</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{debugInfo?.loading ? 'Yes' : 'No'}</div>
                  <div className="text-sm text-orange-700">Loading</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{debugInfo?.error ? 'Yes' : 'No'}</div>
                  <div className="text-sm text-red-700">Error</div>
                </div>
              </div>
            </div>

            {debugInfo?.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">❌ Error</h3>
                <p className="text-sm text-red-700">{debugInfo.error}</p>
              </div>
            )}

            {debugInfo?.properties && debugInfo.properties.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">📋 Properties Details</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {debugInfo.properties.map((property: any, index: number) => (
                    <div key={index} className="p-3 bg-white rounded border">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="font-medium text-gray-900">{property.title}</div>
                          <div className="text-sm text-gray-500">ID: {property._id}</div>
                          <div className="text-sm text-gray-500">District: {property.district}</div>
                          <div className="text-sm text-gray-500">Location: {property.location}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Price: ${property.price?.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">Agent ID: {property.agentId}</div>
                          <div className="text-sm text-gray-500">Status: {property.deletionStatus}</div>
                          <div className="text-sm text-gray-500">Created: {new Date(property.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-xs text-gray-400">Thumbnail: {(property as any).thumbnailImage}</div>
                        <div className="text-xs text-gray-400">Images: {(property as any).images?.length || 0} images</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {debugInfo?.properties && debugInfo.properties.length === 0 && !debugInfo.loading && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ No Properties Found</h3>
                <p className="text-sm text-yellow-700">
                  The database appears to be empty or properties are being filtered out.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

