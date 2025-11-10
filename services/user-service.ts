import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * Validation Schemas
 */

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
  bio: z.string().max(500, 'Bio is too long').optional(),
  timezone: z.string().optional(),
  weekStart: z.number().min(0).max(6).optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  dateFormat: z.string().optional(),
})

export const updateBrandingSchema = z.object({
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
  customDomain: z.string().optional(),
})

export const updateUsernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, hyphens, and underscores'),
})

export type UpdateProfileData = z.infer<typeof updateProfileSchema>
export type UpdateBrandingData = z.infer<typeof updateBrandingSchema>
export type UpdateUsernameData = z.infer<typeof updateUsernameSchema>

export type UserProfile = {
  id: string
  email: string
  username: string
  name: string | null
  bio: string | null
  avatarUrl: string | null
  timezone: string
  brandColor: string | null
  logoUrl: string | null
  customDomain: string | null
  weekStart: number
  timeFormat: '12h' | '24h'
  dateFormat: string
  createdAt: Date
  updatedAt: Date
}

export type ServiceResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Client-side user service
 */
export const userService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<ServiceResult<UserProfile>> {
    try {
      const response = await fetch(`/api/users/${userId}`)

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to fetch profile',
        }
      }

      const data = await response.json()

      return {
        success: true,
        data: data.user,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Get current user's profile
   */
  async getCurrentProfile(): Promise<ServiceResult<UserProfile>> {
    try {
      const response = await fetch('/api/users/me')

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to fetch profile',
        }
      }

      const data = await response.json()

      return {
        success: true,
        data: data.user,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileData): Promise<ServiceResult<UserProfile>> {
    try {
      // Validate data
      const validatedData = updateProfileSchema.parse(data)

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to update profile',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.user,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Update user timezone
   */
  async updateTimezone(userId: string, timezone: string): Promise<ServiceResult<UserProfile>> {
    return this.updateProfile(userId, { timezone })
  },

  /**
   * Update user branding settings
   */
  async updateBranding(userId: string, data: UpdateBrandingData): Promise<ServiceResult<UserProfile>> {
    try {
      // Validate data
      const validatedData = updateBrandingSchema.parse(data)

      const response = await fetch(`/api/users/${userId}/branding`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to update branding',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.user,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Update username
   */
  async updateUsername(userId: string, username: string): Promise<ServiceResult<UserProfile>> {
    try {
      // Validate username
      const validatedData = updateUsernameSchema.parse({ username })

      const response = await fetch(`/api/users/${userId}/username`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to update username',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.user,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Upload avatar image to Supabase Storage
   */
  async uploadAvatar(userId: string, file: File): Promise<ServiceResult<{ avatarUrl: string }>> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          error: 'File must be an image',
        }
      }

      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'File size must be less than 5MB',
        }
      }

      const supabase = createClient()

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        return {
          success: false,
          error: uploadError.message,
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath)

      const avatarUrl = urlData.publicUrl

      // Update user profile with new avatar URL
      const updateResult = await fetch(`/api/users/${userId}/avatar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatarUrl }),
      })

      if (!updateResult.ok) {
        // Clean up uploaded file if profile update fails
        await supabase.storage.from('user-uploads').remove([filePath])

        const error = await updateResult.json()
        return {
          success: false,
          error: error.error || 'Failed to update profile with avatar',
        }
      }

      return {
        success: true,
        data: { avatarUrl },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Upload logo image to Supabase Storage
   */
  async uploadLogo(userId: string, file: File): Promise<ServiceResult<{ logoUrl: string }>> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          error: 'File must be an image',
        }
      }

      // Check file size (max 2MB)
      const maxSize = 2 * 1024 * 1024
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'File size must be less than 2MB',
        }
      }

      const supabase = createClient()

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-logo-${Date.now()}.${fileExt}`
      const filePath = `logos/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        return {
          success: false,
          error: uploadError.message,
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath)

      const logoUrl = urlData.publicUrl

      // Update user branding with new logo URL
      const updateResult = await this.updateBranding(userId, { logoUrl })

      if (!updateResult.success) {
        // Clean up uploaded file if profile update fails
        await supabase.storage.from('user-uploads').remove([filePath])

        return {
          success: false,
          error: updateResult.error || 'Failed to update branding with logo',
        }
      }

      return {
        success: true,
        data: { logoUrl },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Delete user avatar
   */
  async deleteAvatar(userId: string): Promise<ServiceResult<void>> {
    try {
      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to delete avatar',
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Check if username is available
   */
  async checkUsernameAvailability(username: string): Promise<ServiceResult<{ available: boolean }>> {
    try {
      const response = await fetch('/api/users/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to check username',
        }
      }

      return {
        success: true,
        data: { available: data.available },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },
}

/**
 * Server-side user service
 */
export const serverUserService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      return user
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  },

  /**
   * Get user profile by username
   */
  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
      })

      return user
    } catch (error) {
      console.error('Error fetching user profile by username:', error)
      return null
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfile | null> {
    try {
      // Validate data
      const validatedData = updateProfileSchema.parse(data)

      const user = await prisma.user.update({
        where: { id: userId },
        data: validatedData,
      })

      return user
    } catch (error) {
      console.error('Error updating user profile:', error)
      return null
    }
  },

  /**
   * Update user branding
   */
  async updateBranding(userId: string, data: UpdateBrandingData): Promise<UserProfile | null> {
    try {
      // Validate data
      const validatedData = updateBrandingSchema.parse(data)

      const user = await prisma.user.update({
        where: { id: userId },
        data: validatedData,
      })

      return user
    } catch (error) {
      console.error('Error updating user branding:', error)
      return null
    }
  },

  /**
   * Update username
   */
  async updateUsername(userId: string, username: string): Promise<UserProfile | null> {
    try {
      // Validate username
      updateUsernameSchema.parse({ username })

      // Check if username is already taken
      const existingUser = await prisma.user.findUnique({
        where: { username },
      })

      if (existingUser && existingUser.id !== userId) {
        throw new Error('Username is already taken')
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { username },
      })

      return user
    } catch (error) {
      console.error('Error updating username:', error)
      return null
    }
  },

  /**
   * Update avatar URL
   */
  async updateAvatarUrl(userId: string, avatarUrl: string): Promise<UserProfile | null> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
      })

      return user
    } catch (error) {
      console.error('Error updating avatar URL:', error)
      return null
    }
  },

  /**
   * Delete avatar
   */
  async deleteAvatar(userId: string): Promise<UserProfile | null> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: null },
      })

      return user
    } catch (error) {
      console.error('Error deleting avatar:', error)
      return null
    }
  },

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
      })

      if (!user) {
        return true
      }

      // If excludeUserId is provided, check if it's the same user
      if (excludeUserId && user.id === excludeUserId) {
        return true
      }

      return false
    } catch (error) {
      console.error('Error checking username availability:', error)
      return false
    }
  },

  /**
   * Delete user account and all associated data
   */
  async deleteAccount(userId: string): Promise<boolean> {
    try {
      // Delete user (cascade will handle related records)
      await prisma.user.delete({
        where: { id: userId },
      })

      // Delete from Supabase Auth
      const supabase = await createServerClient()
      await supabase.auth.admin.deleteUser(userId)

      return true
    } catch (error) {
      console.error('Error deleting user account:', error)
      return false
    }
  },
}
