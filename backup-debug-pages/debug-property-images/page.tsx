'use client';

import { useState } from 'react';

export default function DebugPropertyImages() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'wrong-domain' | 'empty' | 'correct-domain'>('all');

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/properties?limit=50');
      const data = await response.json();
      
      if (data.success) {
        setProperties(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch properties');
      }
    } catch (err) {
      setError('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'invalid-url';
    }
  };

  const isCorrectDomain = (url: string) => {
    return url.includes('pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev');
  };

  const isWrongDomain = (url: string) => {
    return url.includes('pub-36a660b428c343399354263f0c318585.r2.dev') || 
           url.includes('pub-744f24f8a5918e0d996c5ff4009a7adb.r2.dev');
  };

  const filteredProperties = properties.filter(property => {
    const thumbnailUrl = property.thumbnailImage || '';
    const imageUrls = property.images || [];
    const allUrls = [thumbnailUrl, ...imageUrls].filter(Boolean);

    switch (filter) {
      case 'wrong-domain':
        return allUrls.some(url => isWrongDomain(url));
      case 'correct-domain':
        return allUrls.some(url => isCorrectDomain(url));
      case 'empty':
        return !thumbnailUrl && imageUrls.length === 0;
      default:
        return true;
    }
  });

  const stats = {
    total: properties.length,
    wrongDomain: properties.filter(p => {
      const urls = [p.thumbnailImage, ...(p.images || [])].filter(Boolean);
      return urls.some(url => isWrongDomain(url));
    }).length,
    correctDomain: properties.filter(p => {
      const urls = [p.thumbnailImage, ...(p.images || [])].filter(Boolean);
      return urls.some(url => isCorrectDomain(url));
    }).length,
    empty: properties.filter(p => !p.thumbnailImage && (!p.images || p.images.length === 0)).length
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
              🔍 Property Images Debug
            </h1>
          
          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              This tool shows what image URLs are actually stored in your database and helps identify the issue.
            </p>
            
            <button
              onClick={fetchProperties}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load Properties'}
            </button>
          </div>

          {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">❌ Error</h3>
              <p className="text-red-700">{error}</p>
          </div>
          )}

          {properties.length > 0 && (
          <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-blue-700">Total Properties</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.wrongDomain}</div>
                  <div className="text-sm text-red-700">Wrong Domain</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.correctDomain}</div>
                  <div className="text-sm text-green-700">Correct Domain</div>
                    </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{stats.empty}</div>
                  <div className="text-sm text-gray-700">Empty Images</div>
                    </div>
                  </div>

              {/* Filter */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  All ({stats.total})
                </button>
                <button
                  onClick={() => setFilter('wrong-domain')}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    filter === 'wrong-domain' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Wrong Domain ({stats.wrongDomain})
                </button>
                <button
                  onClick={() => setFilter('correct-domain')}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    filter === 'correct-domain' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Correct Domain ({stats.correctDomain})
                </button>
                <button
                  onClick={() => setFilter('empty')}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    filter === 'empty' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Empty ({stats.empty})
                </button>
                        </div>

              {/* Properties List */}
              <div className="space-y-4">
                {filteredProperties.map((property, index) => {
                  const thumbnailUrl = property.thumbnailImage || '';
                  const imageUrls = property.images || [];
                  const allUrls = [thumbnailUrl, ...imageUrls].filter(Boolean);

                  return (
                    <div key={property._id || index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{property.title}</h3>
                        <div className="flex space-x-2">
                          {allUrls.some(url => isWrongDomain(url)) && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              Wrong Domain
                            </span>
                          )}
                          {allUrls.some(url => isCorrectDomain(url)) && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Correct Domain
                            </span>
                          )}
                          {allUrls.length === 0 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                              No Images
                            </span>
                        )}
                      </div>
                    </div>

                      <div className="space-y-2 text-sm">
                    <div>
                          <span className="font-medium">Thumbnail:</span>
                          {thumbnailUrl ? (
                            <div className="mt-1">
                              <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                                {thumbnailUrl}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Domain: {getDomainFromUrl(thumbnailUrl)}
                                {isWrongDomain(thumbnailUrl) && <span className="text-red-600 ml-2">❌ Wrong</span>}
                                {isCorrectDomain(thumbnailUrl) && <span className="text-green-600 ml-2">✅ Correct</span>}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500 ml-2">None</span>
                          )}
                        </div>

                        {imageUrls.length > 0 && (
                          <div>
                            <span className="font-medium">Additional Images ({imageUrls.length}):</span>
                            <div className="mt-1 space-y-1">
                              {imageUrls.map((url: string, idx: number) => (
                                <div key={idx}>
                                  <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                                    {url}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Domain: {getDomainFromUrl(url)}
                                    {isWrongDomain(url) && <span className="text-red-600 ml-2">❌ Wrong</span>}
                                    {isCorrectDomain(url) && <span className="text-green-600 ml-2">✅ Correct</span>}
                                  </div>
                              </div>
                            ))}
                          </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                  </div>

              {filteredProperties.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No properties found for the selected filter.
                    </div>
                  )}
          </div>
          )}
          </div>
      </div>
    </div>
  );
}