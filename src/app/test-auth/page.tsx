'use client'

import { useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { formatPhoneNumber } from '@/lib/utils'

export default function TestAuthPage() {
  const { user, isAuthenticated, login, logout } = useUser()
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [authResult, setAuthResult] = useState<any>(null)

  const testAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      setAuthResult({ status: res.status, data })
    } catch (error) {
      setAuthResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const createTestAgent = async () => {
    try {
      // First create a test user
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Test Agent',
          phone: '+252999999999',
          password: '1234'
        })
      })
      const signupData = await signupRes.json()
      
      if (signupData.success) {
        // Try to promote to agent (this might fail without admin credentials)
        try {
          const promoteRes = await fetch('/api/auth/promote-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetUserId: signupData.data.id,
              newRole: 'agent',
              adminUserId: signupData.data.id, // This will fail, but we'll see the error
              adminPassword: '1234'
            })
          })
          const promoteData = await promoteRes.json()
          setAuthResult({ 
            signup: signupData, 
            promote: promoteData,
            message: 'Test user created. You may need admin access to promote to agent role.'
          })
        } catch (promoteError) {
          setAuthResult({ 
            signup: signupData, 
            promoteError: promoteError instanceof Error ? promoteError.message : 'Unknown error',
            message: 'Test user created but promotion failed. You can try logging in with +252999999999 / 1234'
          })
        }
      } else {
        setAuthResult({ signup: signupData })
      }
    } catch (error) {
      setAuthResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Test Page</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current State */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Current State</h2>
            <div className="space-y-2">
              <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'None'}</p>
            </div>
            
                         <div className="mt-4 space-y-2">
               <button
                 onClick={testAuth}
                 className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
               >
                 Test /api/auth/me
               </button>
               
               <button
                 onClick={createTestAgent}
                 className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
               >
                 Create Test Agent User
               </button>
               
               {user && (
                 <button
                   onClick={logout}
                   className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                 >
                   Logout
                 </button>
               )}
             </div>
          </div>

          {/* Authentication Forms */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Authentication</h2>
            
            {!isAuthenticated ? (
              <div className="space-y-4">
                <button
                  onClick={() => setShowLogin(true)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Show Login Form
                </button>
                
                <button
                  onClick={() => setShowSignup(true)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Show Signup Form
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-green-600 font-semibold">You are logged in!</p>
                <button
                  onClick={() => window.location.href = '/agent'}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Go to Agent Dashboard
                </button>
              </div>
            )}
          </div>
        </div>

                 {/* Auth Result */}
         {authResult && (
           <div className="mt-8 bg-white rounded-lg p-6 shadow-lg">
             <h2 className="text-xl font-semibold mb-4">API Test Result</h2>
             {authResult.message && (
               <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                 <p className="text-blue-800 font-medium">{authResult.message}</p>
               </div>
             )}
             <pre className="bg-gray-100 p-4 rounded overflow-auto">
               {JSON.stringify(authResult, null, 2)}
             </pre>
           </div>
         )}

         {/* Help Information */}
         <div className="mt-8 bg-white rounded-lg p-6 shadow-lg">
           <h2 className="text-xl font-semibold mb-4">Authentication Help</h2>
           <div className="space-y-4">
             <div>
               <h3 className="font-semibold text-gray-900 mb-2">How to Access Agent Dashboard:</h3>
               <ol className="list-decimal list-inside space-y-1 text-gray-700">
                 <li>Create a test user using the "Create Test Agent User" button</li>
                 <li>Log in with the test credentials (+252999999999 / 1234)</li>
                 <li>Note: The user will be created as a regular user, not an agent</li>
                 <li>To become an agent, you need admin privileges to promote the user</li>
               </ol>
             </div>
             
             <div>
               <h3 className="font-semibold text-gray-900 mb-2">Test Credentials:</h3>
               <div className="bg-gray-50 p-3 rounded-lg">
                 <p><strong>Phone:</strong> {formatPhoneNumber('+252999999999')}</p>
                 <p><strong>Password:</strong> 1234</p>
               </div>
             </div>
             
             <div>
               <h3 className="font-semibold text-gray-900 mb-2">Troubleshooting:</h3>
               <ul className="list-disc list-inside space-y-1 text-gray-700">
                 <li>If you get "Not authenticated" error, you need to log in first</li>
                 <li>If you get "Access denied" error, your user role is not agent/agency</li>
                 <li>Use the "Test /api/auth/me" button to check your current authentication status</li>
               </ul>
             </div>
           </div>
         </div>

        {/* Login Modal */}
        {showLogin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="relative">
              <LoginForm
                onSwitchToSignUp={() => {
                  setShowLogin(false)
                  setShowSignup(true)
                }}
                onClose={() => setShowLogin(false)}
              />
            </div>
          </div>
        )}

        {/* Signup Modal */}
        {showSignup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="relative">
              <SignUpForm
                onSwitchToLogin={() => {
                  setShowSignup(false)
                  setShowLogin(true)
                }}
                onClose={() => setShowSignup(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
