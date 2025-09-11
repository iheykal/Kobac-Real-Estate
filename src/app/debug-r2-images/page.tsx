'use client';

import { useState } from 'react';

export default function DebugR2Images() {
  const [testUrl, setTestUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testImageUrl = async (url: string) => {
    if (!url) return;
    
    setLoading(true);
    setResult(null);

    try {
      // Test if the URL is accessible
      const response = await fetch(url, { method: 'HEAD' });
      
      setResult({
        url,
        status: response.status,
        statusText: response.statusText,
        headers: {
          'content-type': response.headers.get('content-type'),
          'content-length': response.headers.get('content-length'),
          'cache-control': response.headers.get('cache-control'),
        },
        accessible: response.ok,
        error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
      });
    } catch (error) {
      setResult({
        url,
        status: 'ERROR',
        statusText: 'Network Error',
        headers: {},
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testSampleUrls = () => {
    const sampleUrls = [
      'https://pub-36a660b428c343399354263f0c318585.r2.dev/kobac252/uploads/listings/68c0cd463dabd90fc28b9e53/1757466719282-e6c05385250eef91-villa-2.webp',
      'https://pub-744f24f8a5918e0d996c5ff4009a7adb.r2.dev/kobac252/uploads/listings/68c0cb843dabd90fc28b9e12/1757465824729-thumbnail.jpg',
      'https://pub-36a660b428c343399354263f0c318585.r2.dev/kobac252/uploads/listings/test/test-image.webp'
    ];

    setTestUrl(sampleUrls[0]);
    testImageUrl(sampleUrls[0]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔍 R2 Image Debug Tool
          </h1>
          
          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              This tool helps debug why R2 images are failing to load. Test the URLs to see if they're accessible.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Image URL:
                </label>
                <input
                  type="url"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="https://pub-xxx.r2.dev/path/to/image.webp"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => testImageUrl(testUrl)}
                  disabled={loading || !testUrl}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test URL'}
                </button>
                
                <button
                  onClick={testSampleUrls}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Test Sample URLs
                </button>
              </div>
            </div>
          </div>

          {result && (
            <div className="space-y-6">
              <div className={`p-4 rounded-lg border ${
                result.accessible 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`font-medium mb-2 ${
                  result.accessible ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.accessible ? '✅ Image Accessible' : '❌ Image Not Accessible'}
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">URL:</span> {result.url}</div>
                  <div><span className="font-medium">Status:</span> {result.status} {result.statusText}</div>
                  {result.error && (
                    <div><span className="font-medium">Error:</span> {result.error}</div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Response Headers:</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(result.headers).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium">{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : String(value || 'Not set')}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-3">Troubleshooting:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {result.status === 404 && (
                    <li>• <strong>404 Error:</strong> The image doesn't exist in R2. Check if it was actually uploaded.</li>
                  )}
                  {result.status === 403 && (
                    <li>• <strong>403 Error:</strong> The R2 bucket is private or the URL is incorrect.</li>
                  )}
                  {result.status === 'ERROR' && (
                    <li>• <strong>Network Error:</strong> Check your internet connection and R2 domain configuration.</li>
                  )}
                  {result.accessible && (
                    <li>• <strong>Image is accessible!</strong> The issue might be in the frontend component.</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">🔧 Common Issues:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• <strong>Wrong R2 domain:</strong> Check if the R2_PUBLIC_BASE_URL environment variable is correct</li>
              <li>• <strong>Private bucket:</strong> Make sure the R2 bucket is public or use signed URLs</li>
              <li>• <strong>Image never uploaded:</strong> The property might have been created without actually uploading images</li>
              <li>• <strong>Wrong file path:</strong> Check if the file path in R2 matches the URL</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
