import { NextRequest, NextResponse } from 'next/server'
import { serverAuthService } from '@/services/auth-service'
import { serverUserService, updateUsernameSchema } from '@/services/user-service'
import { z } from 'zod'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Get authenticated user
    const authUser = await serverAuthService.getUser()

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is updating their own username
    if (authUser.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateUsernameSchema.parse(body)

    // Check if username is available
    const isAvailable = await serverUserService.isUsernameAvailable(
      validatedData.username,
      userId
    )

    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      )
    }

    // Update username
    const user = await serverUserService.updateUsername(userId, validatedData.username)

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to update username' },
        { status: 500 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating username:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
