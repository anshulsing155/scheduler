import { NextResponse } from 'next/server'
import { serverAuthService } from '@/services/auth-service'
import { serverUserService } from '@/services/user-service.server'

export async function GET() {
  try {
    // Get authenticated user
    const authUser = await serverAuthService.getUser()

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile from database
    let user = await serverUserService.getProfile(authUser.id)

    // If user doesn't exist in database, sync from Supabase
    if (!user) {
      try {
        user = await serverAuthService.syncUserProfile(
          authUser.id,
          authUser.email!,
          authUser.user_metadata
        )
      } catch (syncError) {
        console.error('Error syncing user profile:', syncError)
        return NextResponse.json(
          { error: 'Failed to sync user profile' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching current user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
