import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { userService } from '../user-service'

// Mock Supabase client
const mockStorage = {
  from: vi.fn(() => ({
    upload: vi.fn(),
    getPublicUrl: vi.fn(),
    remove: vi.fn(),
  })),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    storage: mockStorage,
  })),
}))

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getProfile', () => {
    it('should successfully fetch user profile', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        bio: 'Test bio',
        avatarUrl: null,
        timezone: 'America/New_York',
        brandColor: null,
        logoUrl: null,
        customDomain: null,
        weekStart: 0,
        timeFormat: '12h',
        dateFormat: 'MM/DD/YYYY',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockProfile }),
      })

      const result = await userService.getProfile('user-123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockProfile)
      expect(global.fetch).toHaveBeenCalledWith('/api/users/user-123')
    })

    it('should return error when profile fetch fails', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'User not found' }),
      })

      const result = await userService.getProfile('user-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })
  })

  describe('getCurrentProfile', () => {
    it('should fetch current user profile', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        timezone: 'UTC',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockProfile }),
      })

      const result = await userService.getCurrentProfile()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockProfile)
      expect(global.fetch).toHaveBeenCalledWith('/api/users/me')
    })
  })

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio',
        timezone: 'America/Los_Angeles',
      }

      const mockUpdatedProfile = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        ...updateData,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUpdatedProfile }),
      })

      const result = await userService.updateProfile('user-123', updateData)

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('Updated Name')
      expect(result.data?.bio).toBe('Updated bio')
      expect(result.data?.timezone).toBe('America/Los_Angeles')
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users/user-123',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        })
      )
    })

    it('should validate profile data before updating', async () => {
      const invalidData = {
        name: '', // Empty name should fail validation
      }

      const result = await userService.updateProfile('user-123', invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Name is required')
    })

    it('should return error when update fails', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Update failed' }),
      })

      const result = await userService.updateProfile('user-123', { name: 'Test' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('updateTimezone', () => {
    it('should update user timezone', async () => {
      const newTimezone = 'Europe/London'
      const mockUpdatedProfile = {
        id: 'user-123',
        timezone: newTimezone,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUpdatedProfile }),
      })

      const result = await userService.updateTimezone('user-123', newTimezone)

      expect(result.success).toBe(true)
      expect(result.data?.timezone).toBe(newTimezone)
    })

    it('should handle timezone conversion for different regions', async () => {
      const timezones = [
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
        'Pacific/Auckland',
      ]

      for (const timezone of timezones) {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user-123', timezone } }),
        })

        const result = await userService.updateTimezone('user-123', timezone)

        expect(result.success).toBe(true)
        expect(result.data?.timezone).toBe(timezone)
      }
    })
  })

  describe('updateBranding', () => {
    it('should update user branding settings', async () => {
      const brandingData = {
        brandColor: '#FF5733',
        logoUrl: 'https://example.com/logo.png',
      }

      const mockUpdatedProfile = {
        id: 'user-123',
        ...brandingData,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUpdatedProfile }),
      })

      const result = await userService.updateBranding('user-123', brandingData)

      expect(result.success).toBe(true)
      expect(result.data?.brandColor).toBe('#FF5733')
      expect(result.data?.logoUrl).toBe('https://example.com/logo.png')
    })

    it('should validate brand color format', async () => {
      const invalidBranding = {
        brandColor: 'invalid-color',
      }

      const result = await userService.updateBranding('user-123', invalidBranding)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid color format')
    })
  })

  describe('updateUsername', () => {
    it('should update username', async () => {
      const newUsername = 'newusername'
      const mockUpdatedProfile = {
        id: 'user-123',
        username: newUsername,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUpdatedProfile }),
      })

      const result = await userService.updateUsername('user-123', newUsername)

      expect(result.success).toBe(true)
      expect(result.data?.username).toBe(newUsername)
    })

    it('should validate username format', async () => {
      const invalidUsernames = [
        'ab', // Too short
        'UPPERCASE', // Contains uppercase
        'user name', // Contains space
        'user@name', // Contains invalid character
      ]

      for (const username of invalidUsernames) {
        const result = await userService.updateUsername('user-123', username)
        expect(result.success).toBe(false)
      }
    })

    it('should accept valid username formats', async () => {
      const validUsernames = ['user123', 'user-name', 'user_name', 'abc']

      for (const username of validUsernames) {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user-123', username } }),
        })

        const result = await userService.updateUsername('user-123', username)
        expect(result.success).toBe(true)
      }
    })
  })

  describe('uploadAvatar', () => {
    it('should successfully upload avatar', async () => {
      const mockFile = new File(['avatar'], 'avatar.png', { type: 'image/png' })
      const mockAvatarUrl = 'https://storage.supabase.co/avatars/user-123.png'

      const mockStorageBucket = {
        upload: vi.fn().mockResolvedValue({
          data: { path: 'avatars/user-123.png' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: mockAvatarUrl },
        }),
        remove: vi.fn(),
      }

      mockStorage.from.mockReturnValue(mockStorageBucket)

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { avatarUrl: mockAvatarUrl } }),
      })

      const result = await userService.uploadAvatar('user-123', mockFile)

      expect(result.success).toBe(true)
      expect(result.data?.avatarUrl).toBe(mockAvatarUrl)
      expect(mockStorageBucket.upload).toHaveBeenCalled()
    })

    it('should reject non-image files', async () => {
      const mockFile = new File(['text'], 'document.txt', { type: 'text/plain' })

      const result = await userService.uploadAvatar('user-123', mockFile)

      expect(result.success).toBe(false)
      expect(result.error).toBe('File must be an image')
    })

    it('should reject files larger than 5MB', async () => {
      const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.png', {
        type: 'image/png',
      })

      const result = await userService.uploadAvatar('user-123', largeFile)

      expect(result.success).toBe(false)
      expect(result.error).toBe('File size must be less than 5MB')
    })

    it('should clean up uploaded file if profile update fails', async () => {
      const mockFile = new File(['avatar'], 'avatar.png', { type: 'image/png' })

      const mockStorageBucket = {
        upload: vi.fn().mockResolvedValue({
          data: { path: 'avatars/user-123.png' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.supabase.co/avatars/user-123.png' },
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }

      mockStorage.from.mockReturnValue(mockStorageBucket)

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Profile update failed' }),
      })

      const result = await userService.uploadAvatar('user-123', mockFile)

      expect(result.success).toBe(false)
      expect(mockStorageBucket.remove).toHaveBeenCalled()
      expect(mockStorageBucket.remove).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('avatars/user-123')])
      )
    })
  })

  describe('uploadLogo', () => {
    it('should successfully upload logo', async () => {
      const mockFile = new File(['logo'], 'logo.png', { type: 'image/png' })
      const mockLogoUrl = 'https://storage.supabase.co/logos/user-123-logo.png'

      const mockStorageBucket = {
        upload: vi.fn().mockResolvedValue({
          data: { path: 'logos/user-123-logo.png' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: mockLogoUrl },
        }),
        remove: vi.fn(),
      }

      mockStorage.from.mockReturnValue(mockStorageBucket)

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { logoUrl: mockLogoUrl } }),
      })

      const result = await userService.uploadLogo('user-123', mockFile)

      expect(result.success).toBe(true)
      expect(result.data?.logoUrl).toBe(mockLogoUrl)
    })

    it('should reject files larger than 2MB', async () => {
      const largeFile = new File([new ArrayBuffer(3 * 1024 * 1024)], 'large-logo.png', {
        type: 'image/png',
      })

      const result = await userService.uploadLogo('user-123', largeFile)

      expect(result.success).toBe(false)
      expect(result.error).toBe('File size must be less than 2MB')
    })
  })

  describe('deleteAvatar', () => {
    it('should successfully delete avatar', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await userService.deleteAvatar('user-123')

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith('/api/users/user-123/avatar', {
        method: 'DELETE',
      })
    })

    it('should return error when deletion fails', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to delete avatar' }),
      })

      const result = await userService.deleteAvatar('user-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to delete avatar')
    })
  })

  describe('checkUsernameAvailability', () => {
    it('should return true for available username', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ available: true }),
      })

      const result = await userService.checkUsernameAvailability('newusername')

      expect(result.success).toBe(true)
      expect(result.data?.available).toBe(true)
    })

    it('should return false for taken username', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ available: false }),
      })

      const result = await userService.checkUsernameAvailability('takenusername')

      expect(result.success).toBe(true)
      expect(result.data?.available).toBe(false)
    })
  })
})
