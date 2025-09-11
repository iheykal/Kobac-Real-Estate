'use client'

import { useState, useEffect } from 'react'

export default function DebugAuthPage() {
  const [authStatus, setAuthStatus] = useState<string>('Checking...')
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [cookies, setCookies] = useState<string>('')
  const [testLogin, setTestLogin] = useState({ phone: '+252123456789', password: '1234' })

  useEffect(() => {
    checkAuth()
    checkCookies()
  }, [])

  const checkAuth = async () => {
    try {
      setAuthStatus('Checking authentication...')
      const response = await fetch('/api/auth/me', { cache: 'no-store' })
      const data = await response.json()
      
      if (response.ok) {
        setAuthStatus(`✅ Authenticated as: ${data.data?.fullName} (${data.data?.role})`)
        setDebugInfo(data)
      } else {
        setAuthStatus(`❌ Not authenticated: ${data.error}`)
        setDebugInfo(data)
      }
    } catch (error) {
      setAuthStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const checkCookies = async () => {
    try {
      const response = await fetch('/api/debug/auth-debug')
      const data = await response.json()
      if (data.success) {
        setCookies(JSON.stringify(data.debug, null, 2))
      }
    } catch (error) {
      setCookies(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleLogin = async () => {
    try {
      setAuthStatus('Logging in...')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testLogin)
      })
      
      const data = await response.json()
      if (response.ok) {
        setAuthStatus('✅ Login successful! Checking auth...')
        setTimeout(checkAuth, 1000) // Wait a bit then check auth
        setTimeout(checkCookies, 1000) // Also check cookies
      } else {
        setAuthStatus(`❌ Login failed: ${data.error}`)
      }
    } catch (error) {
      setAuthStatus(`❌ Login error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setAuthStatus('✅ Logged out! Checking auth...')
      setTimeout(checkAuth, 1000)
      setTimeout(checkCookies, 1000)
    } catch (error) {
      setAuthStatus(`❌ Logout error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔍 Authentication Debug Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authentication Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">🔐 Authentication Status</h2>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Status:</p>
            <p className={`font-mono text-sm p-2 rounded ${
              authStatus.includes('✅') ? 'bg-green-100 text-green-800' : 
              authStatus.includes('❌') ? 'bg-red-100 text-red-800' : 
              'bg-yellow-100 text-yellow-800'
            }`}>
              {authStatus}
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={checkAuth}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              🔄 Check Auth
            </button>
            
            <button
              onClick={checkCookies}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              🍪 Check Cookies
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Test Login */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">🧪 Test Login</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={testLogin.phone}
                onChange={(e) => setTestLogin(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="text"
                value={testLogin.password}
                onChange={(e) => setTestLogin(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
              />
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              🔑 Test Login
            </button>
          </div>
        </div>
      </div>

      {/* Debug Information */}
      {debugInfo && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">📊 Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* Cookie Information */}
      {cookies && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">🍪 Cookie Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {cookies}
          </pre>
        </div>
      )}
    </div>
  )
}
