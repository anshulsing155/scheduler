import { NextRequest, NextResponse } from 'next/server'
import { serverAuthService } from '@/services/auth-service'
import { serverUserService, updateBrandingSchema } from '@/services/user-service.server'
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

    // Check if user is updating their own branding
    if (authUser.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateBrandingSchema.parse(body)

    // Update branding
    const user = await serverUserService.updateBranding(userId, validatedData)

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to update branding' },
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

    console.error('Error updating user branding:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
