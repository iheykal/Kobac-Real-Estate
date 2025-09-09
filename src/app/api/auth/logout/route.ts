import { NextResponse } from 'next/server'

export async function POST() {
  console.log('🚪 Logout request received')
  
  const res = NextResponse.json({ success: true, message: 'Logged out successfully' })
  
  // Clear the session cookie more aggressively
  res.cookies.set('kobac_session', '', { 
    path: '/', 
    maxAge: 0,
    expires: new Date(0),
    domain: undefined,
    httpOnly: true,
    sameSite: 'lax',
    secure: false // Allow HTTP in development
  })
  
  // Also try to clear with different variations to ensure it's gone
  res.cookies.set('kobac_session', '', { 
    path: '/admin', 
    maxAge: 0,
    expires: new Date(0)
  })
  
  // Clear any potential variations of the cookie
  res.cookies.set('kobac_session', '', { 
    path: '/api', 
    maxAge: 0,
    expires: new Date(0)
  })
  
  // Set a logout flag cookie to prevent auto-login
  res.cookies.set('kobac_logout', 'true', {
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
    httpOnly: false, // Allow client-side access
    sameSite: 'lax',
    secure: false
  })
  
  console.log('✅ Session cookies cleared and logout flag set')
  
  return res
}


