import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Generates a new session ID
 * @returns string - A secure random session ID
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Creates a secure session payload
 * @param userId - The user's ID
 * @param role - The user's role
 * @param sessionId - Optional session ID (will generate if not provided)
 * @returns object - The session payload
 */
export function createSessionPayload(userId: string, role: string, sessionId?: string) {
  return {
    userId: String(userId),
    role: role,
    sessionId: sessionId || generateSessionId(),
    createdAt: Date.now()
  };
}

/**
 * Sets a secure session cookie
 * @param response - The NextResponse object
 * @param sessionPayload - The session payload
 * @param isProduction - Whether we're in production (affects secure flag)
 */
export function setSessionCookie(
  response: NextResponse, 
  sessionPayload: any, 
  isProduction: boolean = false
) {
  const cookieValue = encodeURIComponent(JSON.stringify(sessionPayload));
  
  response.cookies.set('kobac_session', cookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction, // Only secure in production
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    domain: undefined
  });
  
  // Also set a backup cookie with different name for compatibility
  response.cookies.set('kobac_session_alt', cookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    domain: undefined
  });
}

/**
 * Clears the session cookie
 * @param response - The NextResponse object
 */
export function clearSessionCookie(response: NextResponse) {
  // Clear both possible cookie names
  response.cookies.set('kobac_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
    domain: undefined
  });
  
  response.cookies.set('kobac_session_alt', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
    domain: undefined
  });
}

/**
 * Extracts and validates session from request
 * @param request - The NextRequest object
 * @returns object - The session data or null if invalid
 */
export function getSessionFromRequest(request: NextRequest) {
  try {
    // Check both possible cookie names
    let cookie = request.cookies.get('kobac_session')?.value;
    if (!cookie) {
      cookie = request.cookies.get('kobac_session_alt')?.value;
    }
    if (!cookie) {
      return null;
    }

    const session = JSON.parse(decodeURIComponent(cookie));
    
    // Validate session structure - require userId and role, sessionId is optional for legacy sessions
    if (!session.userId || !session.role) {
      console.log('❌ Session validation failed: missing userId or role', { userId: !!session.userId, role: !!session.role });
      return null;
    }

    // For legacy sessions without sessionId, generate one
    if (!session.sessionId) {
      console.log('⚠️ Legacy session detected, adding sessionId');
      session.sessionId = generateSessionId();
    }

    // Check if session is not too old (7 days max)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    if (session.createdAt && (Date.now() - session.createdAt) > maxAge) {
      console.log('❌ Session expired');
      return null;
    }

    console.log('✅ Session validated successfully', { userId: session.userId, role: session.role, hasSessionId: !!session.sessionId });
    return session;
  } catch (error) {
    console.error('Error parsing session:', error);
    return null;
  }
}

/**
 * Regenerates session for a user (prevents session fixation)
 * @param response - The NextResponse object
 * @param userId - The user's ID
 * @param role - The user's role
 * @param isProduction - Whether we're in production
 */
export function regenerateSession(
  response: NextResponse, 
  userId: string, 
  role: string, 
  isProduction: boolean = false
) {
  const newSessionPayload = createSessionPayload(userId, role);
  setSessionCookie(response, newSessionPayload, isProduction);
  return newSessionPayload;
}


