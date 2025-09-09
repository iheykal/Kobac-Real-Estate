'use client'

import { useState, useEffect } from 'react'

export default function DebugCookiesPage() {
  const [cookieInfo, setCookieInfo] = useState<any>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkCookies()
  }, [])

  const checkCookies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/debug/cookie-test', { 
        credentials: 'include',
        cache: 'no-store'
      })
      const data = await response.json()
      if (data.success) {
        setCookieInfo(data.debug)
      }
    } catch (error) {
      console.error('Error checking cookies:', error)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '+252615757575',
          password: '7575'
        }),
        credentials: 'include'
      })
      
      const result = await response.json()
      setTestResults({
        success: response.ok,
        data: result,
        status: response.status
      })
      
      // Wait a bit then check cookies again
      setTimeout(checkCookies, 1000)
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testCookieSet = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/debug/cookie-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set',
          cookieName: 'manual_test_cookie',
          cookieValue: 'manual_value_' + Date.now()
        }),
        credentials: 'include'
      })
      
      const result = await response.json()
      setTestResults({
        success: response.ok,
        data: result,
        status: response.status
      })
      
      // Wait a bit then check cookies again
      setTimeout(checkCookies, 1000)
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testAuthMe = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/me', { 
        credentials: 'include',
        cache: 'no-store'
      })
      
      const result = await response.json()
      setTestResults({
        success: response.ok,
        data: result,
        status: response.status
      })
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🍪 Cookie Debug Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cookie Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">🍪 Current Cookie Status</h2>
          
          <div className="mb-4">
            <button
              onClick={checkCookies}
              disabled={loading}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Checking...' : '🔄 Check Cookies'}
            </button>
          </div>
          
          {cookieInfo && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700">All Cookies:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(cookieInfo.allCookies, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700">Kobac Session:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(cookieInfo.kobacSession, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700">Headers:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(cookieInfo.headers, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Test Actions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">🧪 Test Actions</h2>
          
          <div className="space-y-3">
            <button
              onClick={testLogin}
              disabled={loading}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              🔑 Test Login
            </button>
            
            <button
              onClick={testCookieSet}
              disabled={loading}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              🍪 Test Manual Cookie Set
            </button>
            
            <button
              onClick={testAuthMe}
              disabled={loading}
              className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              🔍 Test Auth/Me
            </button>
          </div>
          
          {testResults && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-700 mb-2">Test Results:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">📋 Debug Instructions</h2>
        
        <div className="space-y-2 text-blue-700">
          <p><strong>Step 1:</strong> Click "Check Cookies" to see current cookie status</p>
          <p><strong>Step 2:</strong> Click "Test Login" to attempt login and set cookies</p>
          <p><strong>Step 3:</strong> Click "Check Cookies" again to see if cookies were set</p>
          <p><strong>Step 4:</strong> Click "Test Auth/Me" to test authentication with cookies</p>
          <p><strong>Step 5:</strong> Check browser DevTools → Application → Cookies to see stored cookies</p>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-100 rounded text-yellow-800">
          <p><strong>🔍 Expected Results:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>After login: Should see cookies in "All Cookies" section</li>
            <li>Auth/Me should return 200 with user data</li>
            <li>Browser DevTools should show cookies stored</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
