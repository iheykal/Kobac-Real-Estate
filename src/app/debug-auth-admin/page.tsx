'use client'

import { useState } from 'react'
import { useUser } from '@/contexts/UserContext'

export default function DebugAuthAdminPage() {
  const { user: contextUser, isAuthenticated, isLoading } = useUser()
  const [debugResult, setDebugResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAdminAuth = async () => {
    try {
      setLoading(true)
      setDebugResult(null)

      const response = await fetch('/api/debug-session-admin', {
        method: 'GET',
        credentials: 'include'
      })

      const data = await response.json()
      setDebugResult({ status: response.status, data })
    } catch (error) {
      setDebugResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const testFixPropertyStatus = async () => {
    try {
      setLoading(true)
      setDebugResult(null)

      const response = await fetch('/api/admin/fix-property-status', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()
      setDebugResult({ status: response.status, data })
    } catch (error) {
      setDebugResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Admin Authentication</h1>
        
        {/* UserContext Info */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">UserContext State</h2>
          <div className="space-y-2">
            <p><strong>isAuthenticated:</strong> {isAuthenticated ? 'true' : 'false'}</p>
            <p><strong>isLoading:</strong> {isLoading ? 'true' : 'false'}</p>
            <p><strong>user:</strong> {contextUser ? JSON.stringify(contextUser, null, 2) : 'null'}</p>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Test API Endpoints</h2>
          <div className="space-x-4">
            <button
              onClick={testAdminAuth}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Admin Auth Debug'}
            </button>
            <button
              onClick={testFixPropertyStatus}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Fix Property Status'}
            </button>
          </div>
        </div>

        {/* Results */}
        {debugResult && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">API Response</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
