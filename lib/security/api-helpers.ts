import { NextRequest, NextResponse } from 'next/server';
import { requireCsrfToken } from './csrf';
import { sanitizeJson } from './sanitize';

/**
 * Wrapper for API routes with security features
 */
export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    requireCsrf?: boolean;
    sanitizeInput?: boolean;
  } = {}
) {
  const { requireCsrf = true, sanitizeInput = true } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // CSRF protection for state-changing methods
      if (requireCsrf) {
        const isValidCsrf = await requireCsrfToken(request);
        if (!isValidCsrf) {
          return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
          );
        }
      }

      // Sanitize request body if needed
      if (sanitizeInput && request.body) {
        try {
          const body = await request.json();
          const sanitized = sanitizeJson(body);
          // Create new request with sanitized body
          const newRequest = new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(sanitized),
          });
          return await handler(newRequest);
        } catch (error) {
          // If body is not JSON, proceed with original request
          return await handler(request);
        }
      }

      return await handler(request);
    } catch (error) {
      console.error('API security error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number = 400
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}
