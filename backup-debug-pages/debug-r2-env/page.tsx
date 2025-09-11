'use client';

import { useState, useEffect } from 'react';

export default function DebugR2EnvPage() {
  const [envData, setEnvData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnvData = async () => {
      try {
        const response = await fetch('/api/debug-r2-env');
        const data = await response.json();
        setEnvData(data);
      } catch (error) {
        console.error('Error fetching R2 env data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnvData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading R2 environment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔍 R2 Environment Variables Debug
          </h1>
          
          {envData ? (
            <div className="space-y-6">
              {/* Current Environment Variables */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-3">📋 Current R2 Environment Variables</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">R2_ENDPOINT:</span> {envData.R2_ENDPOINT || 'Not set'}</div>
                  <div><span className="font-medium">R2_ACCESS_KEY_ID:</span> {envData.R2_ACCESS_KEY_ID ? '***' + envData.R2_ACCESS_KEY_ID.slice(-4) : 'Not set'}</div>
                  <div><span className="font-medium">R2_SECRET_ACCESS_KEY:</span> {envData.R2_SECRET_ACCESS_KEY ? '***' + envData.R2_SECRET_ACCESS_KEY.slice(-4) : 'Not set'}</div>
                  <div><span className="font-medium">R2_BUCKET:</span> {envData.R2_BUCKET || 'Not set'}</div>
                  <div><span className="font-medium">R2_PUBLIC_BASE:</span> {envData.R2_PUBLIC_BASE || 'Not set'}</div>
                  <div><span className="font-medium">R2_PUBLIC_BASE_URL:</span> {envData.R2_PUBLIC_BASE_URL || 'Not set'}</div>
                </div>
              </div>

              {/* Expected Configuration */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-3">✅ Expected Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">R2_ENDPOINT:</span> https://744f24f8a5918e0d996c5ff4009a7adb.r2.cloudflarestorage.com</div>
                  <div><span className="font-medium">R2_ACCESS_KEY_ID:</span> c2ae5342602ed875ceb34511c3f4b84f</div>
                  <div><span className="font-medium">R2_SECRET_ACCESS_KEY:</span> 18cf00f1ad8dc838487eff29b55189978318bd082e906400def42595f4d249ee</div>
                  <div><span className="font-medium">R2_BUCKET:</span> kobac252</div>
                  <div><span className="font-medium">R2_PUBLIC_BASE:</span> pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev</div>
                  <div><span className="font-medium">R2_PUBLIC_BASE_URL:</span> https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev</div>
                </div>
              </div>

              {/* Status Check */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-3">🔍 Status Check</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">R2_PUBLIC_BASE:</span> 
                    {envData.R2_PUBLIC_BASE === 'pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev' ? 
                      <span className="text-green-600 ml-2">✅ Correct</span> : 
                      <span className="text-red-600 ml-2">❌ Incorrect</span>
                    }
                  </div>
                  <div>
                    <span className="font-medium">R2_PUBLIC_BASE_URL:</span> 
                    {envData.R2_PUBLIC_BASE_URL === 'https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev' ? 
                      <span className="text-green-600 ml-2">✅ Correct</span> : 
                      <span className="text-red-600 ml-2">❌ Incorrect</span>
                    }
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">⚡ Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.href = '/admin/fix-r2-urls'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
                  >
                    Fix Existing R2 URLs
                  </button>
                  <button
                    onClick={() => window.location.href = '/debug-r2-config'}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mr-2"
                  >
                    Check R2 Config
                  </button>
                  <button
                    onClick={() => window.location.href = '/test-r2-upload'}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Test R2 Upload
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">❌ Error</h3>
              <p className="text-red-700 text-sm">Failed to load R2 environment data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
