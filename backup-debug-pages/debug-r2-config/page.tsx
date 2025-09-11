'use client';

import { useState } from 'react';

export default function DebugR2Config() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkR2Config = async () => {
    setLoading(true);
    setError(null);
    setConfig(null);

    try {
      const response = await fetch('/api/debug-r2-config');
      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
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
            🔧 R2 Configuration Debug
          </h1>
          
          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              This tool checks your R2 configuration and helps identify issues with image URLs.
            </p>
            
            <button
              onClick={checkR2Config}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check R2 Configuration'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">❌ Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {config && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-3">🔧 R2 Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">R2 Endpoint:</span> {config.r2Endpoint || 'Not set'}</div>
                  <div><span className="font-medium">R2 Bucket:</span> {config.r2Bucket || 'Not set'}</div>
                  <div><span className="font-medium">R2 Public Base URL:</span> {config.r2PublicBaseUrl || 'Not set'}</div>
                  <div><span className="font-medium">R2 Public Base:</span> {config.r2PublicBase || 'Not set'}</div>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-3">✅ Environment Variables Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${config.hasR2Endpoint ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>R2_ENDPOINT: {config.hasR2Endpoint ? 'Set' : 'Missing'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${config.hasR2Bucket ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>R2_BUCKET: {config.hasR2Bucket ? 'Set' : 'Missing'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${config.hasR2AccessKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>R2_ACCESS_KEY_ID: {config.hasR2AccessKey ? 'Set' : 'Missing'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${config.hasR2SecretKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>R2_SECRET_ACCESS_KEY: {config.hasR2SecretKey ? 'Set' : 'Missing'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${config.hasR2PublicBase ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>R2_PUBLIC_BASE: {config.hasR2PublicBase ? 'Set' : 'Missing'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-3">⚠️ Common Issues</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {!config.hasR2PublicBase && (
                    <li>• <strong>Missing R2_PUBLIC_BASE:</strong> This is needed for public image URLs</li>
                  )}
                  {config.r2PublicBaseUrl && config.r2PublicBase && config.r2PublicBaseUrl !== config.r2PublicBase && (
                    <li>• <strong>URL Mismatch:</strong> R2_PUBLIC_BASE_URL and R2_PUBLIC_BASE are different</li>
                  )}
                  {!config.hasR2Endpoint && (
                    <li>• <strong>Missing R2_ENDPOINT:</strong> This is required for R2 uploads</li>
                  )}
                  {!config.hasR2Bucket && (
                    <li>• <strong>Missing R2_BUCKET:</strong> This is required for R2 uploads</li>
                  )}
                </ul>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">🔍 Sample URLs</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Expected URL format:</span>
                    <div className="mt-1 p-2 bg-white rounded border font-mono text-xs">
                      {config.r2PublicBase || config.r2PublicBaseUrl || 'R2_PUBLIC_BASE'}/kobac252/uploads/listings/{`{propertyId}/{filename}`}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Example URL:</span>
                    <div className="mt-1 p-2 bg-white rounded border font-mono text-xs">
                      {config.r2PublicBase || config.r2PublicBaseUrl || 'R2_PUBLIC_BASE'}/kobac252/uploads/listings/68c0cd463dabd90fc28b9e53/1757466719282-e6c05385250eef91-villa-2.webp
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
