'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';

export default function DebugSuperadminAccess() {
  const { user, isAuthenticated, loading } = useUser();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [apiTest, setApiTest] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // Get session info from cookies
    const getSessionInfo = () => {
      const cookies = document.cookie.split(';');
      const allCookies = cookies.map(cookie => cookie.trim());
      
      // Look for session cookies
      const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('kobac_session='));
      const sessionAltCookie = cookies.find(cookie => cookie.trim().startsWith('kobac_session_alt='));
      
      const sessionData = {
        allCookies: allCookies,
        sessionCookie: sessionCookie || 'Not found',
        sessionAltCookie: sessionAltCookie || 'Not found',
        found: false,
        parsed: null,
        error: null
      };
      
      if (sessionCookie) {
        try {
          const sessionValue = sessionCookie.split('=')[1];
          const decodedSession = decodeURIComponent(sessionValue);
          const session = JSON.parse(decodedSession);
          sessionData.found = true;
          sessionData.parsed = session;
        } catch (error) {
          sessionData.error = `Failed to parse session cookie: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      } else if (sessionAltCookie) {
        try {
          const sessionValue = sessionAltCookie.split('=')[1];
          const decodedSession = decodeURIComponent(sessionValue);
          const session = JSON.parse(decodedSession);
          sessionData.found = true;
          sessionData.parsed = session;
        } catch (error) {
          sessionData.error = `Failed to parse alt session cookie: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      } else {
        sessionData.error = 'No session cookies found';
      }
      
      setSessionInfo(sessionData);
    };

    getSessionInfo();
  }, []);

  const testSuperadminAccess = async () => {
    setTesting(true);
    setApiTest(null);

    try {
      const response = await fetch('/api/admin/fix-existing-properties', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      setApiTest({
        status: response.status,
        statusText: response.statusText,
        data: data,
        success: response.ok
      });
    } catch (error) {
      setApiTest({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    } finally {
      setTesting(false);
    }
  };

  const testSessionSet = async () => {
    setTesting(true);
    setApiTest(null);

    try {
      const response = await fetch('/api/test-session-set', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      setApiTest({
        status: response.status,
        statusText: response.statusText,
        data: data,
        success: response.ok,
        testType: 'session-set'
      });
      
      // Refresh session info after setting
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setApiTest({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        testType: 'session-set'
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔍 Superadmin Access Debug
          </h1>
          
          <div className="space-y-6">
            {/* User Context Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">👤 User Context</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Is Authenticated:</span> {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
                <div><span className="font-medium">User ID:</span> {user?.id || 'Not available'}</div>
                <div><span className="font-medium">User Role:</span> {user?.role || 'Not available'}</div>
                <div><span className="font-medium">User Name:</span> {user?.fullName || 'Not available'}</div>
                <div><span className="font-medium">Is Superadmin:</span> {user?.role === 'superadmin' ? '✅ Yes' : '❌ No'}</div>
              </div>
            </div>

            {/* Session Cookie Info */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">🍪 Session Cookie</h3>
              {sessionInfo ? (
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Found:</span> {sessionInfo.found ? '✅ Yes' : '❌ No'}</div>
                  
                  {sessionInfo.error ? (
                    <div className="text-red-600">{sessionInfo.error}</div>
                  ) : sessionInfo.parsed ? (
                    <>
                      <div><span className="font-medium">User ID:</span> {sessionInfo.parsed.userId || 'Not available'}</div>
                      <div><span className="font-medium">Role:</span> {sessionInfo.parsed.role || 'Not available'}</div>
                      <div><span className="font-medium">Is Superadmin:</span> {sessionInfo.parsed.role === 'superadmin' ? '✅ Yes' : '❌ No'}</div>
                    </>
                  ) : (
                    <div className="text-gray-500">No parsed session data</div>
                  )}
                  
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Show all cookies</summary>
                    <div className="mt-2 p-2 bg-white rounded border text-xs">
                      {sessionInfo.allCookies.map((cookie, index) => (
                        <div key={index} className="break-all">{cookie}</div>
                      ))}
                    </div>
                  </details>
                </div>
              ) : (
                <div className="text-gray-500">Loading session info...</div>
              )}
            </div>

            {/* API Test */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-3">🧪 API Test</h3>
              <div className="space-y-2">
                <button
                  onClick={testSessionSet}
                  disabled={testing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mr-2"
                >
                  {testing ? 'Testing...' : 'Test Set Session Cookie'}
                </button>
                <button
                  onClick={testSuperadminAccess}
                  disabled={testing}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  {testing ? 'Testing...' : 'Test Superadmin API Access'}
                </button>
              </div>
              
              {apiTest && (
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Status:</span> {apiTest.status} {apiTest.statusText}</div>
                  <div><span className="font-medium">Success:</span> {apiTest.success ? '✅ Yes' : '❌ No'}</div>
                  {apiTest.error && (
                    <div><span className="font-medium">Error:</span> {apiTest.error}</div>
                  )}
                  {apiTest.data && (
                    <div>
                      <span className="font-medium">Response:</span>
                      <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto">
                        {JSON.stringify(apiTest.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Troubleshooting */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-medium text-red-800 mb-3">🔧 Troubleshooting</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• <strong>Role Mismatch:</strong> Check if User Context role matches Session Cookie role</li>
                <li>• <strong>Session Expired:</strong> Try logging out and logging back in</li>
                <li>• <strong>Cookie Issues:</strong> Clear browser cookies and try again</li>
                <li>• <strong>Case Sensitivity:</strong> Ensure role is exactly 'superadmin' (lowercase)</li>
                <li>• <strong>Database Role:</strong> Check if your user role in the database is correct</li>
              </ul>
            </div>

            {/* Quick Fixes */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">⚡ Quick Fixes</h3>
              <div className="space-y-2">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => {
                    document.cookie = 'kobac_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 mr-2"
                >
                  Clear Session & Reload
                </button>
                <button
                  onClick={() => window.location.href = '/admin'}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Go to Admin Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
