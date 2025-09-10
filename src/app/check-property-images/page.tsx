'use client';

import { useState, useEffect } from 'react';

interface ImageAnalysis {
  url: string;
  filename: string;
  extension: string;
  isWebP: boolean;
  isR2: boolean;
  format: string;
}

interface PropertyAnalysis {
  propertyId: number;
  title: string;
  createdAt: string;
  totalImages: number;
  images: ImageAnalysis[];
  webpCount: number;
  nonWebpCount: number;
  r2Count: number;
}

interface AnalysisResult {
  success: boolean;
  summary: {
    totalProperties: number;
    totalImages: number;
    webpImages: number;
    nonWebpImages: number;
    r2Images: number;
    webpPercentage: string;
  };
  properties: PropertyAnalysis[];
  message: string;
}

export default function CheckPropertyImages() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkPropertyImages = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔍 Checking property images...');
      const response = await fetch('/api/check-property-images');
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        console.log('✅ Property image analysis completed:', data);
      } else {
        setError(data.error || 'Analysis failed');
        console.error('❌ Property image analysis failed:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Property image analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔍 Property Images WebP Analysis
          </h1>
          
          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              This tool analyzes your existing property images to check which ones are in WebP format
              and which ones still need to be converted for optimal performance.
            </p>
            
            <button
              onClick={checkPropertyImages}
              disabled={loading}
              className={`px-6 py-3 rounded-md font-medium ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? '🔄 Analyzing...' : '🔍 Check Property Images'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-red-800 font-medium">❌ Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-blue-800 font-medium text-lg mb-4">📊 Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Total Properties</p>
                    <p className="text-2xl font-bold text-blue-600">{result.summary.totalProperties}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Total Images</p>
                    <p className="text-2xl font-bold text-blue-600">{result.summary.totalImages}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">WebP Images</p>
                    <p className="text-2xl font-bold text-green-600">{result.summary.webpImages}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">WebP Percentage</p>
                    <p className="text-2xl font-bold text-green-600">{result.summary.webpPercentage}</p>
                  </div>
                </div>
                <p className="text-blue-700 mt-4">{result.message}</p>
              </div>

              {/* WebP Status */}
              {parseFloat(result.summary.webpPercentage) >= 80 ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="text-green-800 font-medium">🎉 Excellent WebP Conversion!</h3>
                  <p className="text-green-700 mt-1">
                    Most of your property images are already in WebP format. Your site is optimized for fast loading!
                  </p>
                </div>
              ) : parseFloat(result.summary.webpPercentage) >= 50 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h3 className="text-yellow-800 font-medium">⚠️ Partial WebP Conversion</h3>
                  <p className="text-yellow-700 mt-1">
                    Some of your images are in WebP format, but there's room for improvement. 
                    New uploads will automatically be converted to WebP.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-red-800 font-medium">❌ Low WebP Conversion</h3>
                  <p className="text-red-700 mt-1">
                    Most of your images are not in WebP format. Consider converting existing images 
                    or ensure new uploads are using the WebP conversion system.
                  </p>
                </div>
              )}

              {/* Property Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">📋 Property Details</h3>
                {result.properties.map((property, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-md">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{property.title}</h4>
                        <p className="text-sm text-gray-600">ID: {property.propertyId}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-gray-600">
                          {property.webpCount}/{property.totalImages} WebP
                        </p>
                        <p className="text-gray-500">
                          {property.r2Count} R2 images
                        </p>
                      </div>
                    </div>
                    
                    {property.images.length > 0 && (
                      <div className="space-y-2">
                        {property.images.map((image, imgIndex) => (
                          <div key={imgIndex} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                image.isWebP 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {image.format}
                              </span>
                              <span className="text-gray-600 truncate max-w-xs">
                                {image.filename}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {image.isR2 && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  R2
                                </span>
                              )}
                              <a 
                                href={image.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                View
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
