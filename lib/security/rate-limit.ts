import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (for production, use Redis or similar)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
}

export const rateLimitConfigs = {
  // Public booking pages - more lenient
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  // Authentication endpoints - strict
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  // API endpoints - moderate
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  // Booking creation - strict
  booking: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
};

/**
 * Rate limiting middleware
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns true if rate limit exceeded, false otherwise
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { limited: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;

  // Initialize or get existing rate limit data
  if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    return {
      limited: false,
      remaining: config.maxRequests - 1,
      resetTime: rateLimitStore[key].resetTime,
    };
  }

  // Increment count
  rateLimitStore[key].count++;

  // Check if limit exceeded
  const limited = rateLimitStore[key].count > config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - rateLimitStore[key].count);

  return {
    limited,
    remaining,
    resetTime: rateLimitStore[key].resetTime,
  };
}

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get real IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwardedFor) {
    return `ip:${forwardedFor.split(',')[0].trim()}`;
  }
  
  if (realIp) {
    return `ip:${realIp}`;
  }

  // Fallback to connection IP
  return `ip:${request.ip || 'unknown'}`;
}

/**
 * Create rate limit response with appropriate headers
 */
export function createRateLimitResponse(
  remaining: number,
  resetTime: number,
  limited: boolean = false
): NextResponse {
  const response = limited
    ? NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    : NextResponse.next();

  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());

  if (limited) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    response.headers.set('Retry-After', retryAfter.toString());
  }

  return response;
}

/**
 * Rate limit middleware wrapper for API routes
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = rateLimitConfigs.api
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const identifier = getClientIdentifier(request);
    const { limited, remaining, resetTime } = checkRateLimit(identifier, config);

    if (limited) {
      return createRateLimitResponse(remaining, resetTime, true);
    }

    const response = await handler(request);
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());

    return response;
  };
}
