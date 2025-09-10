'use client';

import { useState } from 'react';

export default function FixR2Domain() {
  const [currentConfig, setCurrentConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkCurrentConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/debug-r2-config');
      const data = await response.json();

      if (data.success) {
        setCurrentConfig(data.config);
      } else {
        setError(data.error || 'Failed to get R2 config');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔧 Fix R2 Domain Configuration
          </h1>
          
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">🚨 Issue Identified:</h3>
            <p className="text-red-700 mb-2">
              Your R2 domain is incorrect! You're using the wrong bucket domain.
            </p>
            <div className="text-sm text-red-600 space-y-1">
              <div><span className="font-medium">Correct domain:</span> <code className="bg-red-100 px-1 rounded">https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev</code></div>
              <div><span className="font-medium">Wrong domains in use:</span></div>
              <ul className="ml-4 space-y-1">
                <li>• <code className="bg-red-100 px-1 rounded">https://pub-36a660b428c343399354263f0c318585.r2.dev</code></li>
                <li>• <code className="bg-red-100 px-1 rounded">https://pub-744f24f8a5918e0d996c5ff4009a7adb.r2.dev</code></li>
              </ul>
            </div>
          </div>

          <div className="mb-8">
            <button
              onClick={checkCurrentConfig}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Current Configuration'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">❌ Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {currentConfig && (
            <div className="space-y-6">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-3">⚠️ Current Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">R2_PUBLIC_BASE:</span> <code className="bg-yellow-100 px-1 rounded">{currentConfig.r2PublicBase || 'Not set'}</code></div>
                  <div><span className="font-medium">R2_PUBLIC_BASE_URL:</span> <code className="bg-yellow-100 px-1 rounded">{currentConfig.r2PublicBaseUrl || 'Not set'}</code></div>
                  <div><span className="font-medium">R2_ENDPOINT:</span> <code className="bg-yellow-100 px-1 rounded">{currentConfig.r2Endpoint || 'Not set'}</code></div>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-3">✅ Required Changes</h3>
                <p className="text-green-700 mb-3">
                  Update your environment variables to use the correct R2 domain:
                </p>
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium text-gray-800 mb-2">Environment Variables to Update:</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div><span className="text-blue-600">R2_PUBLIC_BASE</span>=<span className="text-green-600">https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev</span></div>
                    <div><span className="text-blue-600">R2_PUBLIC_BASE_URL</span>=<span className="text-green-600">https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev</span></div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-3">🔧 How to Fix:</h3>
                <ol className="text-sm text-blue-700 space-y-2">
                  <li><strong>1.</strong> Update your <code className="bg-blue-100 px-1 rounded">.env.local</code> file with the correct domain</li>
                  <li><strong>2.</strong> Restart your development server</li>
                  <li><strong>3.</strong> Test uploading a new image to verify it works</li>
                  <li><strong>4.</strong> Run the property fix tool to clean up existing properties</li>
                </ol>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">📋 Example .env.local Update:</h3>
                <div className="bg-white p-4 rounded border">
                  <pre className="text-sm text-gray-700">
{`# R2 Configuration
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=your-bucket-name
R2_PUBLIC_BASE=https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev
R2_PUBLIC_BASE_URL=https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev`}
                  </pre>
                </div>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-medium text-orange-800 mb-3">⚠️ Important Notes:</h3>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• <strong>Using wrong bucket:</strong> Images uploaded to wrong bucket will be inaccessible</li>
                  <li>• <strong>Data corruption:</strong> No, using wrong bucket won't corrupt data, but images won't load</li>
                  <li>• <strong>Existing properties:</strong> Will need to be fixed after updating the domain</li>
                  <li>• <strong>New uploads:</strong> Will work correctly once domain is fixed</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
