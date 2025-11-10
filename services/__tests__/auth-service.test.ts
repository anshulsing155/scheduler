import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { authService } from '../auth-service'
import { authService } from '../auth-service'
import { authService } from '../auth-service'
import { authService } from '../auth-service'
import { authService } from '../auth-service'
import { authService } from '../auth-service'
import { authService } from '../auth-service'
import { authService } from '../auth-service'
import { authService } from '../auth-service'
import { authService } from '../auth-service'
import { authService } from '../auth-service'
import { authService } from '../auth-service'
import { authService } from '../auth-service'
import { authService } from '../auth-service'
import { authService } from '../auth-service'
import { authService } from '../auth-service'
import { authService } from '../auth-service'
import { authService } from '../auth-service'

// Create mock auth object
const mockAuth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
  verifyOtp: vi.fn(),
  resend: vi.fn(),
  refreshSession: vi.fn(),
}

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: mockAuth,
  })),
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      exchangeCodeForSession: vi.fn(),
    },
  })),
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const { authService } = await import('../auth-service')
      
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: 'test@example.com',
        identities: [{ id: '1' }] as any,
      }

      // Mock username check
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ available: true }),
      })

      mockAuth.signUp.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        username: 'testuser',
      })

      expect(result.success).toBe(true)
      expect(result.data?.user).toEqual(mockUser)
      expect(result.data?.needsEmailVerification).toBe(false)
    })

    it('should return error when username is taken', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Username is already taken' }),
      })

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        username: 'testuser',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Username is already taken')
    })

    it('should indicate email verification is needed', async () => {
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: 'test@example.com',
        identities: [],
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ available: true }),
      })

      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.signUp as any).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        username: 'testuser',
      })

      expect(result.success).toBe(true)
      expect(result.data?.needsEmailVerification).toBe(true)
    })
  })

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: 'test@example.com',
      }
      const mockSession = { access_token: 'token-123' }

      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.signInWithPassword as any).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(true)
      expect(result.data?.user).toEqual(mockUser)
      expect(result.data?.session).toEqual(mockSession)
    })

    it('should return user-friendly error for invalid credentials', async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.signInWithPassword as any).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email or password')
    })

    it('should return error for unverified email', async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.signInWithPassword as any).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' },
      })

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Please verify your email address before signing in')
    })
  })

  describe('signInWithOAuth', () => {
    it('should generate OAuth URL for Google', async () => {
      const mockUrl = 'https://accounts.google.com/oauth'

      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.signInWithOAuth as any).mockResolvedValueOnce({
        data: { url: mockUrl },
        error: null,
      })

      const result = await authService.signInWithOAuth('google')

      expect(result.success).toBe(true)
      expect(result.data?.url).toBe(mockUrl)
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback?next=/dashboard',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
    })

    it('should handle custom redirect URL', async () => {
      const mockUrl = 'https://accounts.google.com/oauth'

      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.signInWithOAuth as any).mockResolvedValueOnce({
        data: { url: mockUrl },
        error: null,
      })

      const result = await authService.signInWithOAuth('google', '/profile')

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback?next=%2Fprofile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
    })

    it('should return error when OAuth URL generation fails', async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.signInWithOAuth as any).mockResolvedValueOnce({
        data: { url: null },
        error: null,
      })

      const result = await authService.signInWithOAuth('google')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to generate OAuth URL')
    })
  })

  describe('signOut', () => {
    it('should successfully sign out user', async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.signOut as any).mockResolvedValueOnce({
        error: null,
      })

      const result = await authService.signOut()

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should return error on sign out failure', async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.signOut as any).mockResolvedValueOnce({
        error: { message: 'Sign out failed' },
      })

      const result = await authService.signOut()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Sign out failed')
    })
  })

  describe('resetPasswordForEmail', () => {
    it('should send password reset email', async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.resetPasswordForEmail as any).mockResolvedValueOnce({
        error: null,
      })

      const result = await authService.resetPasswordForEmail('test@example.com')

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: 'http://localhost:3000/auth/update-password' }
      )
    })
  })

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.updateUser as any).mockResolvedValueOnce({
        error: null,
      })

      const result = await authService.updatePassword('newpassword123')

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      })
    })
  })

  describe('getSession', () => {
    it('should return current session', async () => {
      const mockSession = { access_token: 'token-123' }

      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.getSession as any).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      })

      const result = await authService.getSession()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockSession)
    })
  })

  describe('getUser', () => {
    it('should return current user', async () => {
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: 'test@example.com',
      }

      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.getUser as any).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      const result = await authService.getUser()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
    })

    it('should return error when no user found', async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.getUser as any).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      const result = await authService.getUser()

      expect(result.success).toBe(false)
      expect(result.error).toBe('No user found')
    })
  })

  describe('verifyEmail', () => {
    it('should verify email with token', async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.verifyOtp as any).mockResolvedValueOnce({
        error: null,
      })

      const result = await authService.verifyEmail('token-123')

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: 'token-123',
        type: 'email',
      })
    })
  })

  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.resend as any).mockResolvedValueOnce({
        error: null,
      })

      const result = await authService.resendVerificationEmail('test@example.com')

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/callback?next=/dashboard',
        },
      })
    })
  })

  describe('refreshSession', () => {
    it('should refresh current session', async () => {
      const mockSession = { access_token: 'new-token-123' }

      const { createClient } = await import('@/lib/supabase/client')
      const mockSupabase = createClient()
      ;(mockSupabase.auth.refreshSession as any).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      })

      const result = await authService.refreshSession()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockSession)
    })
  })
})
