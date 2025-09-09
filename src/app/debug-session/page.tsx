'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/contexts/UserContext'

export default function DebugSession() {
  const { user, isAuthenticated, isLoading } = useUser()
  const [sessionData, setSessionData] = useState<any>(null)
  const [authCheck, setAuthCheck] = useState<any>(null)
  const [middlewareTest, setMiddlewareTest] = useState<any>(null)

  useEffect(() => {
    const runDebugChecks = async () => {
      // Check session cookie
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=')
        acc[name] = value
        return acc
      }, {} as Record<string, string>)

      let parsedSession = null
      if (cookies.kobac_session) {
        try {
          parsedSession = JSON.parse(decodeURIComponent(cookies.kobac_session))
        } catch (e) {
          console.error('Failed to parse session:', e)
        }
      }

      setSessionData({
        cookies,
        parsedSession,
        rawSession: cookies.kobac_session
      })

      // Check API auth
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' })
        const data = await response.json()
        setAuthCheck({ status: response.status, data })
      } catch (error) {
        setAuthCheck({ error: error instanceof Error ? error.message : String(error) })
      }

      // Test middleware by trying to access admin
      try {
        const response = await fetch('/admin', { 
          credentials: 'include',
          redirect: 'manual' // Don't follow redirects
        })
        setMiddlewareTest({
          status: response.status,
          redirected: response.type === 'opaqueredirect',
          url: response.url
        })
      } catch (error) {
        setMiddlewareTest({ error: error instanceof Error ? error.message : String(error) })
      }
    }

    runDebugChecks()
  }, [])

  const testRoleAccess = (role: string) => {
    const routeRules: Record<string, string[]> = {
      '/admin': ['superadmin'],
      '/agent': ['agent', 'superadmin'],
      '/dashboard': ['user', 'agent', 'superadmin'],
      '/profile': ['user', 'agent', 'superadmin']
    }
    
    const results: Record<string, boolean> = {}
    for (const [route, allowedRoles] of Object.entries(routeRules)) {
      results[route] = allowedRoles.includes(role)
    }
    return results
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Session & Authorization Debug</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UserContext State */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-3">UserContext State</h2>
          <pre className="text-sm overflow-auto max-h-64">
            {JSON.stringify({ user, isAuthenticated, isLoading }, null, 2)}
          </pre>
        </div>

        {/* Session Cookie Data */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-3">Session Cookie Data</h2>
          <pre className="text-sm overflow-auto max-h-64">
            {JSON.stringify(sessionData, null, 2)}
          </pre>
        </div>

        {/* API Auth Check */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-3">API Auth Check</h2>
          <pre className="text-sm overflow-auto max-h-64">
            {JSON.stringify(authCheck, null, 2)}
          </pre>
        </div>

        {/* Middleware Test */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-3">Middleware Test</h2>
          <pre className="text-sm overflow-auto max-h-64">
            {JSON.stringify(middlewareTest, null, 2)}
          </pre>
        </div>

        {/* Role Access Test */}
        {user?.role && (
          <div className="bg-gray-100 p-4 rounded-lg lg:col-span-2">
            <h2 className="text-xl font-bold mb-3">Role Access Test for: {user.role}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(testRoleAccess(user.role)).map(([route, canAccess]) => (
                <div key={route} className={`p-3 rounded ${canAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <div className="font-semibold">{route}</div>
                  <div className="text-sm">{canAccess ? '✅ Allowed' : '❌ Denied'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gray-100 p-4 rounded-lg lg:col-span-2">
          <h2 className="text-xl font-bold mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => window.location.href = '/admin'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try /admin
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Try /dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                document.cookie = 'kobac_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
                window.location.href = '/'
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear Session & Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
