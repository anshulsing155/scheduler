import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { User } from '@supabase/supabase-js'

export type SignUpData = {
  email: string
  password: string
  name: string
  username: string
}

export type SignInData = {
  email: string
  password: string
}

export type OAuthProvider = 'google' | 'azure'

export type AuthResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

export type PasswordResetData = {
  email: string
}

export type UpdatePasswordData = {
  password: string
}

export type VerifyEmailData = {
  token: string
  type: 'signup' | 'email_change' | 'recovery'
}

/**
 * Client-side authentication service
 */
export const authService = {
  /**
   * Sign up a new user with email and password
   * Sends email verification link to user
   */
  async signUp(data: SignUpData): Promise<AuthResult<{ user: User | null; needsEmailVerification: boolean }>> {
    try {
      const supabase = createClient()

      // Check if username is already taken
      const usernameCheck = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.username }),
      })

      if (!usernameCheck.ok) {
        const result = await usernameCheck.json()
        return {
          success: false,
          error: result.error || 'Username is already taken',
        }
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            username: data.username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      })

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      // Check if email confirmation is required
      const needsEmailVerification = authData.user?.identities?.length === 0

      return {
        success: true,
        data: {
          user: authData.user,
          needsEmailVerification: needsEmailVerification || false,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInData): Promise<AuthResult<{ user: User; session: any }>> {
    try {
      const supabase = createClient()

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        // Provide user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          return {
            success: false,
            error: 'Invalid email or password',
          }
        }
        if (error.message.includes('Email not confirmed')) {
          return {
            success: false,
            error: 'Please verify your email address before signing in',
          }
        }
        return {
          success: false,
          error: error.message,
        }
      }

      if (!authData.user || !authData.session) {
        return {
          success: false,
          error: 'Authentication failed',
        }
      }

      return {
        success: true,
        data: {
          user: authData.user,
          session: authData.session,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Sign in with OAuth provider (Google, Microsoft)
   * Redirects user to OAuth provider's login page
   */
  async signInWithOAuth(
    provider: OAuthProvider,
    redirectTo?: string
  ): Promise<AuthResult<{ url: string }>> {
    try {
      const supabase = createClient()

      const callbackUrl = redirectTo
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
        : `${window.location.origin}/auth/callback?next=/dashboard`

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      if (!data.url) {
        return {
          success: false,
          error: 'Failed to generate OAuth URL',
        }
      }

      return {
        success: true,
        data: { url: data.url },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Sign out the current user
   * Clears session and redirects to login page
   */
  async signOut(): Promise<AuthResult<void>> {
    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          error: error.message,
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
   * Send password reset email
   * User will receive an email with a link to reset their password
   */
  async resetPasswordForEmail(email: string): Promise<AuthResult<void>> {
    try {
      const supabase = createClient()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) {
        return {
          success: false,
          error: error.message,
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
   * Update user password
   * Must be called after user clicks reset password link
   */
  async updatePassword(newPassword: string): Promise<AuthResult<void>> {
    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return {
          success: false,
          error: error.message,
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
   * Get current session
   */
  async getSession(): Promise<AuthResult<any>> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.getSession()

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
        data: data.session,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Get current user
   */
  async getUser(): Promise<AuthResult<User>> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.getUser()

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      if (!data.user) {
        return {
          success: false,
          error: 'No user found',
        }
      }

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
   * Verify email with OTP token
   * Used for email verification after signup
   */
  async verifyEmail(token: string, type: 'signup' | 'email_change' = 'signup'): Promise<AuthResult<void>> {
    try {
      const supabase = createClient()

      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type === 'signup' ? 'email' : 'email_change',
      })

      if (error) {
        return {
          success: false,
          error: error.message,
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
   * Resend email verification
   * Useful if user didn't receive the initial verification email
   */
  async resendVerificationEmail(email: string): Promise<AuthResult<void>> {
    try {
      const supabase = createClient()

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      })

      if (error) {
        return {
          success: false,
          error: error.message,
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
   * Refresh the current session
   * Useful for keeping user logged in
   */
  async refreshSession(): Promise<AuthResult<any>> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
        data: data.session,
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
 * Server-side authentication service
 */
export const serverAuthService = {
  /**
   * Get current user from server
   */
  async getUser() {
    try {
      const supabase = await createServerClient()

      const { data, error } = await supabase.auth.getUser()

      if (error) {
        console.error('Error getting user:', error)
        return null
      }

      return data.user
    } catch (error) {
      console.error('Unexpected error getting user:', error)
      return null
    }
  },

  /**
   * Get current session from server
   */
  async getSession() {
    try {
      const supabase = await createServerClient()

      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session:', error)
        return null
      }

      return data.session
    } catch (error) {
      console.error('Unexpected error getting session:', error)
      return null
    }
  },

  /**
   * Handle OAuth callback
   * Exchanges authorization code for session and syncs user profile
   */
  async handleOAuthCallback(code: string): Promise<AuthResult<{ user: User; redirectUrl: string }>> {
    try {
      const supabase = await createServerClient()

      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      if (!data.user) {
        return {
          success: false,
          error: 'No user data received from OAuth provider',
        }
      }

      // Sync user profile to database
      await this.syncUserProfile(
        data.user.id,
        data.user.email!,
        data.user.user_metadata
      )

      return {
        success: true,
        data: {
          user: data.user,
          redirectUrl: '/dashboard',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth callback failed',
      }
    }
  },

  /**
   * Create or update user profile in database after authentication
   * Handles both email/password and OAuth signups
   */
  async syncUserProfile(supabaseUserId: string, email: string, metadata: any) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: supabaseUserId },
            { email: email },
          ],
        },
      })

      if (existingUser) {
        // Update existing user if needed
        if (existingUser.id !== supabaseUserId) {
          // Update the user ID if it changed (shouldn't happen normally)
          return await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              id: supabaseUserId,
            },
          })
        }
        return existingUser
      }

      // Generate unique username
      let username = metadata.username || email.split('@')[0]
      let usernameExists = await prisma.user.findUnique({
        where: { username },
      })

      // If username exists, append random numbers
      let attempts = 0
      while (usernameExists && attempts < 10) {
        username = `${metadata.username || email.split('@')[0]}${Math.floor(Math.random() * 10000)}`
        usernameExists = await prisma.user.findUnique({
          where: { username },
        })
        attempts++
      }

      // Create new user profile
      const name = metadata.name || metadata.full_name || email.split('@')[0]

      const user = await prisma.user.create({
        data: {
          id: supabaseUserId,
          email: email,
          username: username,
          name: name,
          timezone: 'UTC',
          avatarUrl: metadata.avatar_url || metadata.picture || null,
        },
      })

      return user
    } catch (error) {
      console.error('Error syncing user profile:', error)
      throw error
    }
  },

  /**
   * Require authentication - throws error if not authenticated
   */
  async requireAuth() {
    const user = await this.getUser()

    if (!user) {
      throw new Error('Authentication required')
    }

    return user
  },

  /**
   * Get user with profile data from database
   */
  async getUserWithProfile() {
    try {
      const user = await this.getUser()

      if (!user) {
        return null
      }

      const profile = await prisma.user.findUnique({
        where: { id: user.id },
      })

      return {
        ...user,
        profile,
      }
    } catch (error) {
      console.error('Error getting user with profile:', error)
      return null
    }
  },

  /**
   * Verify user's email is confirmed
   */
  async isEmailVerified(): Promise<boolean> {
    try {
      const user = await this.getUser()

      if (!user) {
        return false
      }

      return !!user.email_confirmed_at
    } catch (error) {
      console.error('Error checking email verification:', error)
      return false
    }
  },
}
