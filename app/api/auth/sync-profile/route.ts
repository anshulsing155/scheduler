import { NextResponse } from 'next/server'
import { serverAuthService } from '@/services/auth-service'

export async function POST() {
  try {
    const user = await serverAuthService.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Sync user profile to database
    const profile = await serverAuthService.syncUserProfile(
      user.id,
      user.email!,
      user.user_metadata
    )

    return NextResponse.json({ 
      success: true,
      profile 
    })
  } catch (error) {
    console.error('Error syncing profile:', error)
    return NextResponse.json(
      { error: 'Failed to sync profile' },
      { status: 500 }
    )
  }
}
