'use client'

import React, { useState } from 'react'

export default function DebugAuthIssue() {
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  })
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/debug-auth-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: 'Request failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Debug Authentication Issue
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Login Credentials</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Authentication'}
            </button>
          </form>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Results</h2>
            
            <div className={`p-4 rounded-lg mb-4 ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <h3 className={`font-semibold ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success ? '✅ Debug Successful' : '❌ Debug Failed'}
              </h3>
              {result.error && (
                <p className={`mt-2 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.error}
                </p>
              )}
            </div>

            {result.debug && (
              <div className="space-y-6">
                {/* User Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">User Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(result.debug.user, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Password Test */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Password Test</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(result.debug.passwordTest, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Phone Normalization */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Phone Normalization</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(result.debug.phoneNormalization, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Similar Users */}
                {result.debug.similarUsers && result.debug.similarUsers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Similar Users Found</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(result.debug.similarUsers, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {result.details && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Details</h3>
                <div className="bg-red-50 p-4 rounded-lg">
                  <pre className="text-sm text-red-700 whitespace-pre-wrap">
                    {result.details}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            How to Use This Debug Tool
          </h3>
          <ul className="text-blue-800 space-y-2">
            <li>• Enter the phone number and password you're trying to use for login</li>
            <li>• The tool will check if the user exists in the database</li>
            <li>• It will test password verification with both new and legacy systems</li>
            <li>• Check the results to see what might be causing the login issue</li>
            <li>• Look for any error messages or unexpected behavior</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
