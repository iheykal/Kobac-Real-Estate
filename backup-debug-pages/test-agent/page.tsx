'use client'

import { useState, useEffect } from 'react'
import { formatPhoneNumber } from '@/lib/utils'

export default function TestAgentPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      console.log('Checking user role...')
      const res = await fetch('/api/auth/me')
      const result = await res.json()
      console.log('Auth response:', result)
      console.log('Response structure:', Object.keys(result))
      console.log('Success field:', result.success)
      console.log('User field:', result.user)
      console.log('Data field:', result.data)
      
      // Handle different response structures
      let userData = null
      
      if (res.ok) {
        if (result.user) {
          userData = result.user
        } else if (result.data && result.data.user) {
          userData = result.data.user
        } else if (result.data && !result.data.user) {
          userData = result.data
        } else if (result.success && result.data) {
          userData = result.data
        }
      }
      
      if (userData) {
        setUser(userData)
        console.log('User data extracted:', userData)
        
        if (userData.role === 'agent' || userData.role === 'agency') {
          console.log('✅ User is an agent!')
        } else {
          console.log('❌ User is NOT an agent. Role:', userData.role)
        }
      } else {
        setError('Not authenticated - no user data found')
        console.log('❌ No user data found in response')
        console.log('Full response:', result)
      }
    } catch (error) {
      setError('Error checking authentication')
      console.error('❌ Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testAgentAccess = () => {
    if (user?.role === 'agent' || user?.role === 'agency') {
      window.location.href = '/agent'
    } else {
      alert(`You need to be an agent to access the dashboard. Current role: ${user?.role || 'Not authenticated'}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking user role...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Agent Access Test</h1>
          
          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              <strong>Error:</strong> {error}
            </div>
          ) : user ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
                <h2 className="font-bold mb-2">User Information:</h2>
                <p><strong>Name:</strong> {user.fullName || 'N/A'}</p>
                <p><strong>Phone:</strong> {user.phone ? formatPhoneNumber(user.phone) : 'N/A'}</p>
                <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                <p><strong>Role:</strong> <span className={`font-bold ${(user.role === 'agent' || user.role === 'agency') ? 'text-green-600' : 'text-red-600'}`}>
                  {user.role || 'N/A'}
                </span></p>
                <p><strong>Status:</strong> {user.status || 'N/A'}</p>
              </div>
              
              {(user.role === 'agent' || user.role === 'agency') ? (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                  <h3 className="font-bold mb-2">✅ Agent Access Granted!</h3>
                  <p>You have access to the Agent Dashboard.</p>
                  <button
                    onClick={testAgentAccess}
                    className="mt-3 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Go to Agent Dashboard
                  </button>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                  <h3 className="font-bold mb-2">⚠️ Agent Access Required</h3>
                  <p>Your current role "{user.role}" does not have access to the Agent Dashboard.</p>
                  <p className="mt-2">To list properties, you need to be upgraded to agent status.</p>
                </div>
              )}
              
              <div className="bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-lg">
                <h3 className="font-bold mb-2">Debug Information:</h3>
                <p>Check the browser console for detailed logs.</p>
                <p>User ID: {user.id}</p>
                <p>Session data: {JSON.stringify(user, null, 2)}</p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <h3 className="font-bold mb-2">Not Authenticated</h3>
              <p>You need to sign in to test agent access.</p>
              <a href="/" className="inline-block mt-3 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                Go to Homepage
              </a>
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-bold mb-2">Quick Actions:</h3>
            <div className="flex space-x-4">
              <a href="/" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Homepage
              </a>
              <a href="/agent-debug" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Agent Debug
              </a>
              {user && (user.role === 'agent' || user.role === 'agency') && (
                <a href="/agent" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Agent Dashboard
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
