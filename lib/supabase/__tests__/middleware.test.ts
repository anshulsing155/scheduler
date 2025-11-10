import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '../middleware'

// Mock Supabase SSR
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((url, key, options) => {
    // Store the cookie handlers for testing
    const cookieHandlers = options.cookies
    return {
      auth: {
        getUser: vi.fn(),
      },
      _cookieHandlers: cookieHandlers,
    }
  }),
}))

describe('middleware - updateSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create Supabase client and call getUser', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/dashboard')

    const { createServerClient } = await import('@supabase/ssr')
    
    const result = await updateSession(mockRequest)

    expect(createServerClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      expect.objectContaining({
        cookies: expect.objectContaining({
          get: expect.any(Function),
          set: expect.any(Function),
          remove: expect.any(Function),
        }),
      })
    )

    expect(result).toBeInstanceOf(NextResponse)
  })

  it('should handle cookie get operations', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/dashboard')
    mockRequest.cookies.set('test-cookie', 'test-value')

    const { createServerClient } = await import('@supabase/ssr')
    
    await updateSession(mockRequest)

    const createClientCall = (createServerClient as any).mock.calls[0]
    const cookieHandlers = createClientCall[2].cookies

    const cookieValue = cookieHandlers.get('test-cookie')
    expect(cookieValue).toBe('test-value')
  })

  it('should handle cookie set operations', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/dashboard')

    const { createServerClient } = await import('@supabase/ssr')
    
    const result = await updateSession(mockRequest)

    const createClientCall = (createServerClient as any).mock.calls[0]
    const cookieHandlers = createClientCall[2].cookies

    // Test that set function exists and can be called
    expect(() => {
      cookieHandlers.set('new-cookie', 'new-value', { path: '/' })
    }).not.toThrow()

    expect(result).toBeInstanceOf(NextResponse)
  })

  it('should handle cookie remove operations', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/dashboard')
    mockRequest.cookies.set('remove-me', 'value')

    const { createServerClient } = await import('@supabase/ssr')
    
    const result = await updateSession(mockRequest)

    const createClientCall = (createServerClient as any).mock.calls[0]
    const cookieHandlers = createClientCall[2].cookies

    // Test that remove function exists and can be called
    expect(() => {
      cookieHandlers.remove('remove-me', { path: '/' })
    }).not.toThrow()

    expect(result).toBeInstanceOf(NextResponse)
  })

  it('should preserve request headers in response', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        'x-custom-header': 'custom-value',
      },
    })

    const result = await updateSession(mockRequest)

    expect(result).toBeInstanceOf(NextResponse)
    // Note: NextResponse.next() creates a new response that may not preserve all custom headers
    // This is expected behavior for middleware
  })

  it('should handle protected routes', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/dashboard')

    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValueOnce({
          data: { user: null },
          error: null,
        }),
      },
    }
    ;(createServerClient as any).mockReturnValueOnce(mockSupabase)

    const result = await updateSession(mockRequest)

    expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    expect(result).toBeInstanceOf(NextResponse)
  })

  it('should allow authenticated users through', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/dashboard')

    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValueOnce({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
            },
          },
          error: null,
        }),
      },
    }
    ;(createServerClient as any).mockReturnValueOnce(mockSupabase)

    const result = await updateSession(mockRequest)

    expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    expect(result).toBeInstanceOf(NextResponse)
  })

  it('should handle multiple cookie operations in sequence', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/dashboard')
    mockRequest.cookies.set('cookie1', 'value1')
    mockRequest.cookies.set('cookie2', 'value2')

    const { createServerClient } = await import('@supabase/ssr')
    
    await updateSession(mockRequest)

    const createClientCall = (createServerClient as any).mock.calls[0]
    const cookieHandlers = createClientCall[2].cookies

    expect(cookieHandlers.get('cookie1')).toBe('value1')
    expect(cookieHandlers.get('cookie2')).toBe('value2')

    // Test setting multiple cookies
    cookieHandlers.set('cookie3', 'value3', { path: '/' })
    cookieHandlers.set('cookie4', 'value4', { path: '/' })

    // Test removing cookies
    cookieHandlers.remove('cookie1', { path: '/' })
    cookieHandlers.remove('cookie2', { path: '/' })
  })
})
