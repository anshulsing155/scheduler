import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { applySecurityHeaders } from '@/lib/security/headers'
import { checkRateLimit, getClientIdentifier, rateLimitConfigs } from '@/lib/security/rate-limit'

export async function middleware(request: NextRequest) {
  // Apply rate limiting based on path
  const path = request.nextUrl.pathname;
  let rateLimitConfig = rateLimitConfigs.api;

  if (path.startsWith('/api/auth')) {
    rateLimitConfig = rateLimitConfigs.auth;
  } else if (path.startsWith('/api/booking')) {
    rateLimitConfig = rateLimitConfigs.booking;
  } else if (path.match(/^\/[^/]+\/[^/]+$/)) {
    // Public booking pages (username/slug pattern)
    rateLimitConfig = rateLimitConfigs.public;
  }

  const identifier = getClientIdentifier(request);
  const { limited, remaining, resetTime } = checkRateLimit(identifier, rateLimitConfig);

  if (limited) {
    const response = NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
    response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());
    return applySecurityHeaders(response);
  }

  // Update session (Supabase auth)
  let response = await updateSession(request);

  // Apply security headers
  response = applySecurityHeaders(response);

  // Add rate limit headers
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
