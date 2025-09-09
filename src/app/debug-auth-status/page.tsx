'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/contexts/UserContext'

export default function DebugAuthStatus() {
  const { user, isAuthenticated, isLoading } = useUser()
  const [authCheck, setAuthCheck] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' })
        const data = await response.json()
        setAuthCheck({ response: response.status, data })
      } catch (error) {
        setAuthCheck({ error: error instanceof Error ? error.message : String(error) })
      }
    }
    checkAuth()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">UserContext State:</h2>
          <pre>{JSON.stringify({ user, isAuthenticated, isLoading }, null, 2)}</pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">API Auth Check:</h2>
          <pre>{JSON.stringify(authCheck, null, 2)}</pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Cookies:</h2>
          <pre>{typeof document !== 'undefined' ? document.cookie : 'Loading...'}</pre>
        </div>
      </div>
    </div>
  )
}
