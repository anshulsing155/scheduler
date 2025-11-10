import { NextResponse } from 'next/server'
import { serverAuthService } from '@/services/auth-service'
import { serverUserService } from '@/services/user-service'

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
    const user = await serverUserService.getProfile(authUser.id)

    if (!user) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
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
