import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * Validation Schemas (re-exported for server use)
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
      const supabase = await createClient()
      await supabase.auth.admin.deleteUser(userId)

      return true
    } catch (error) {
      console.error('Error deleting user account:', error)
      return false
    }
  },
}
