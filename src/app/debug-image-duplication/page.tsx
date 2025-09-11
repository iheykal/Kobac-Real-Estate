'use client'

import React, { useState, useEffect } from 'react';
import { getAllImageUrls } from '@/lib/imageUrlResolver';

export default function DebugImageDuplicationPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/properties');
      const data = await response.json();
      
      if (response.ok) {
        setProperties(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch properties');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const analyzePropertyImages = (property: any) => {
    const allUrls = getAllImageUrls(property);
    const uniqueUrls = Array.from(new Set(allUrls));
    
    return {
      thumbnailImage: property.thumbnailImage,
      imagesArray: property.images,
      allUrls,
      uniqueUrls,
      hasDuplicates: allUrls.length !== uniqueUrls.length,
      duplicateCount: allUrls.length - uniqueUrls.length
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={fetchProperties}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const propertiesWithDuplicates = properties.filter(property => {
    const analysis = analyzePropertyImages(property);
    return analysis.hasDuplicates;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔍 Image Duplication Debug
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{properties.length}</div>
              <div className="text-blue-800">Total Properties</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{propertiesWithDuplicates.length}</div>
              <div className="text-orange-800">Properties with Duplicates</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{properties.length - propertiesWithDuplicates.length}</div>
              <div className="text-green-800">Properties without Duplicates</div>
            </div>
          </div>

          {propertiesWithDuplicates.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🚨 Properties with Duplicate Images
              </h2>
              <div className="space-y-4">
                {propertiesWithDuplicates.map((property, index) => {
                  const analysis = analyzePropertyImages(property);
                  return (
                    <div key={property._id || property.propertyId || index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="font-semibold text-red-800 mb-2">
                        {property.title} (ID: {property.propertyId || property._id})
                      </div>
                      <div className="text-sm text-red-700 space-y-1">
                        <div><strong>Thumbnail:</strong> {analysis.thumbnailImage || 'None'}</div>
                        <div><strong>Images Array:</strong> {analysis.imagesArray?.length || 0} images</div>
                        <div><strong>All URLs:</strong> {analysis.allUrls.length} total</div>
                        <div><strong>Unique URLs:</strong> {analysis.uniqueUrls.length} unique</div>
                        <div><strong>Duplicates:</strong> {analysis.duplicateCount} duplicate(s)</div>
                        <div className="mt-2">
                          <strong>All URLs:</strong>
                          <ul className="ml-4 list-disc">
                            {analysis.allUrls.map((url, i) => (
                              <li key={i} className="break-all">{url}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong>Unique URLs:</strong>
                          <ul className="ml-4 list-disc">
                            {analysis.uniqueUrls.map((url, i) => (
                              <li key={i} className="break-all">{url}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📋 All Properties Analysis
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {properties.map((property, index) => {
                const analysis = analyzePropertyImages(property);
                return (
                  <div key={property._id || property.propertyId || index} className={`border rounded-lg p-4 ${analysis.hasDuplicates ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className={`font-semibold mb-2 ${analysis.hasDuplicates ? 'text-red-800' : 'text-gray-800'}`}>
                      {property.title} (ID: {property.propertyId || property._id})
                      {analysis.hasDuplicates && <span className="ml-2 text-red-600">🚨 HAS DUPLICATES</span>}
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div><strong>Thumbnail:</strong> {analysis.thumbnailImage || 'None'}</div>
                      <div><strong>Images Array:</strong> {analysis.imagesArray?.length || 0} images</div>
                      <div><strong>Total URLs:</strong> {analysis.allUrls.length}</div>
                      <div><strong>Unique URLs:</strong> {analysis.uniqueUrls.length}</div>
                      {analysis.hasDuplicates && (
                        <div className="text-red-600"><strong>Duplicates:</strong> {analysis.duplicateCount}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

