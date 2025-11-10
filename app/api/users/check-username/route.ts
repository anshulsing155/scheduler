import { NextRequest, NextResponse } from 'next/server'
import { serverUserService } from '@/services/user-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Check if username is available
    const available = await serverUserService.isUsernameAvailable(username)

    return NextResponse.json({ available })
  } catch (error) {
    console.error('Error checking username availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
