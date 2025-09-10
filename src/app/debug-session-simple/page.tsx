'use client'

import { useState } from 'react'
import { useUser } from '@/contexts/UserContext'

export default function DebugSessionSimplePage() {
  const { user: contextUser, isAuthenticated, isLoading } = useUser()
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSession = async () => {
    try {
      setLoading(true)
      setTestResult(null)

      const response = await fetch('/api/debug-session-admin', {
        method: 'GET',
        credentials: 'include'
      })

      const data = await response.json()
      setTestResult({ 
        status: response.status, 
        ok: response.ok,
        data 
      })
    } catch (error) {
      setTestResult({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const clearLocalStorage = () => {
    localStorage.removeItem('luxury-estates-user')
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple Session Debug</h1>
        
        {/* Current State */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Current State</h2>
          <div className="space-y-2">
            <p><strong>UserContext isAuthenticated:</strong> {isAuthenticated ? '✅ true' : '❌ false'}</p>
            <p><strong>UserContext isLoading:</strong> {isLoading ? '⏳ true' : '✅ false'}</p>
            <p><strong>UserContext user:</strong> {contextUser ? '✅ Present' : '❌ null'}</p>
            {contextUser && (
              <div className="ml-4">
                <p><strong>Role:</strong> {contextUser.role}</p>
                <p><strong>Name:</strong> {contextUser.firstName} {contextUser.lastName}</p>
                <p><strong>Phone:</strong> {contextUser.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={testSession}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Server Session'}
            </button>
            <button
              onClick={clearLocalStorage}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear LocalStorage & Reload
            </button>
          </div>
        </div>

        {/* Results */}
        {testResult && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="mb-4">
              <p><strong>Status:</strong> {testResult.status}</p>
              <p><strong>OK:</strong> {testResult.ok ? '✅ true' : '❌ false'}</p>
            </div>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mt-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">How to Fix This Issue</h2>
          <div className="space-y-2 text-yellow-700">
            <p><strong>Option 1:</strong> Log out and log back in to get a fresh session cookie</p>
            <p><strong>Option 2:</strong> Clear your browser cookies for this site</p>
            <p><strong>Option 3:</strong> Restart your development server</p>
            <p><strong>Option 4:</strong> Use the "Clear LocalStorage & Reload" button above</p>
          </div>
        </div>
      </div>
    </div>
  )
}
