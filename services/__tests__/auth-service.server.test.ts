import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'

// Create mock auth object
const mockServerAuth = {
  getUser: vi.fn(),
  getSession: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: mockServerAuth,
  })),
}))

// Mock Prisma
const mockPrisma = {
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

describe('serverAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUser', () => {
    it('should return user from server', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: 'test@example.com',
      }

      mockServerAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      const result = await serverAuthService.getUser()

      expect(result).toEqual(mockUser)
    })

    it('should return null on error', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      mockServerAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Error' },
      })

      const result = await serverAuthService.getUser()

      expect(result).toBeNull()
    })
  })

  describe('getSession', () => {
    it('should return session from server', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      const mockSession = { access_token: 'token-123' }

      mockServerAuth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      })

      const result = await serverAuthService.getSession()

      expect(result).toEqual(mockSession)
    })

    it('should return null on error', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      mockServerAuth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Error' },
      })

      const result = await serverAuthService.getSession()

      expect(result).toBeNull()
    })
  })

  describe('handleOAuthCallback', () => {
    it('should exchange code for session and sync user profile', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User',
          username: 'testuser',
        },
      }

      mockServerAuth.exchangeCodeForSession.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      mockPrisma.user.findFirst.mockResolvedValueOnce(null)
      mockPrisma.user.findUnique.mockResolvedValueOnce(null)
      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      })

      const result = await serverAuthService.handleOAuthCallback('auth-code-123')

      expect(result.success).toBe(true)
      expect(result.data?.user).toEqual(mockUser)
      expect(result.data?.redirectUrl).toBe('/dashboard')
      expect(mockServerAuth.exchangeCodeForSession).toHaveBeenCalledWith('auth-code-123')
    })

    it('should return error when code exchange fails', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      mockServerAuth.exchangeCodeForSession.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid code' },
      })

      const result = await serverAuthService.handleOAuthCallback('invalid-code')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid code')
    })

    it('should return error when no user data received', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      mockServerAuth.exchangeCodeForSession.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      const result = await serverAuthService.handleOAuthCallback('auth-code-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('No user data received from OAuth provider')
    })
  })

  describe('syncUserProfile', () => {
    it('should create new user profile', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      mockPrisma.user.findFirst.mockResolvedValueOnce(null)
      mockPrisma.user.findUnique.mockResolvedValueOnce(null)
      
      const mockCreatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        timezone: 'UTC',
        avatarUrl: null,
      }
      mockPrisma.user.create.mockResolvedValueOnce(mockCreatedUser)

      const result = await serverAuthService.syncUserProfile(
        'user-123',
        'test@example.com',
        { name: 'Test User', username: 'testuser' }
      )

      expect(result).toEqual(mockCreatedUser)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          username: 'testuser',
          name: 'Test User',
          timezone: 'UTC',
          avatarUrl: null,
        },
      })
    })

    it('should return existing user if already exists', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      const existingUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        timezone: 'UTC',
      }

      mockPrisma.user.findFirst.mockResolvedValueOnce(existingUser)

      const result = await serverAuthService.syncUserProfile(
        'user-123',
        'test@example.com',
        { name: 'Test User' }
      )

      expect(result).toEqual(existingUser)
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('should generate unique username if taken', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      mockPrisma.user.findFirst.mockResolvedValueOnce(null)
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ username: 'testuser' }) // First attempt taken
        .mockResolvedValueOnce(null) // Second attempt available

      const mockCreatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser1234',
        name: 'Test User',
      }
      mockPrisma.user.create.mockResolvedValueOnce(mockCreatedUser)

      await serverAuthService.syncUserProfile(
        'user-123',
        'test@example.com',
        { username: 'testuser', name: 'Test User' }
      )

      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2)
      expect(mockPrisma.user.create).toHaveBeenCalled()
    })
  })

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: 'test@example.com',
      }

      mockServerAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      const result = await serverAuthService.requireAuth()

      expect(result).toEqual(mockUser)
    })

    it('should throw error when not authenticated', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      mockServerAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      await expect(serverAuthService.requireAuth()).rejects.toThrow('Authentication required')
    })
  })

  describe('getUserWithProfile', () => {
    it('should return user with profile data', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: 'test@example.com',
      }

      const mockProfile = {
        id: 'user-123',
        username: 'testuser',
        name: 'Test User',
      }

      mockServerAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockProfile)

      const result = await serverAuthService.getUserWithProfile()

      expect(result).toEqual({
        ...mockUser,
        profile: mockProfile,
      })
    })

    it('should return null when no user', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      mockServerAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      const result = await serverAuthService.getUserWithProfile()

      expect(result).toBeNull()
    })
  })

  describe('isEmailVerified', () => {
    it('should return true when email is verified', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: '2024-01-01T00:00:00Z',
      }

      mockServerAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      const result = await serverAuthService.isEmailVerified()

      expect(result).toBe(true)
    })

    it('should return false when email is not verified', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: undefined,
      }

      mockServerAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      const result = await serverAuthService.isEmailVerified()

      expect(result).toBe(false)
    })

    it('should return false when no user', async () => {
      const { serverAuthService } = await import('../auth-service')
      
      mockServerAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      const result = await serverAuthService.isEmailVerified()

      expect(result).toBe(false)
    })
  })
})
