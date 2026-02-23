import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession, deleteSession, createUser, getUserByEmail, getSession } from '@/lib/auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const SITE_PASSWORD = process.env.SITE_PASSWORD || 'Potomac1234';
const AUTH_COOKIE = 'potomac_auth';

// Simple password auth (existing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle simple password auth (existing functionality)
    if (body.password !== undefined && !body.action) {
      if (body.password === SITE_PASSWORD) {
        const response = NextResponse.json({ success: true });
        response.cookies.set(AUTH_COOKIE, SITE_PASSWORD, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
        });
        return response;
      }
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }

    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';

    const { action, email, password, name } = body;

    // Login action (user auth)
    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
      }

      // Check rate limit for auth attempts
      const rateResult = checkRateLimit(`auth:${clientIp}`, RATE_LIMITS.auth);
      if (!rateResult.allowed) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.', retryAfter: rateResult.retryAfter },
          { status: 429 }
        );
      }

      const result = authenticateUser(email, password);
      
      if (!result) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      // Set session cookie
      const response = NextResponse.json({ 
        success: true, 
        user: result.user,
        sessionId: result.session.id,
      });
      
      response.cookies.set('session_id', result.session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
      });

      return response;
    }
    
    // Logout action
    if (action === 'logout') {
      const sessionId = request.cookies.get('session_id')?.value;
      if (sessionId) {
        deleteSession(sessionId);
      }

      const response = NextResponse.json({ success: true });
      response.cookies.delete('session_id');
      return response;
    }

    // Register action
    if (action === 'register') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
      }

      // Check if user already exists
      const existing = getUserByEmail(email);
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }

      // Create user
      const user = createUser(email, password, name || email.split('@')[0], 'user');
      if (!user) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      // Create session
      const session = createSession(user.id);

      const response = NextResponse.json({ 
        success: true, 
        user,
        sessionId: session.id,
      });
      
      response.cookies.set('session_id', session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  // Check simple password auth (existing)
  const siteAuth = request.cookies.get(AUTH_COOKIE)?.value;
  if (siteAuth === SITE_PASSWORD) {
    // Check for user session
    const sessionId = request.cookies.get('session_id')?.value;
    if (sessionId) {
      const session = getSession(sessionId);
      if (session?.user) {
        return NextResponse.json({ 
          authenticated: true, 
          user: session.user 
        });
      }
    }
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false });
}