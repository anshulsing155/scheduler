import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/protected-route'
import { serverTeamService, updateTeamMemberRoleSchema } from '@/services/team-service'
import { z } from 'zod'

/**
 * PATCH /api/teams/[teamId]/members/[memberId]
 * Update a team member's role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { teamId: string; memberId: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId, memberId } = params

    // Check if user is admin or owner
    const isAdmin = await serverTeamService.isTeamAdmin(teamId, user.id)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only team admins can update member roles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validatedData = updateTeamMemberRoleSchema.parse(body)

    const member = await serverTeamService.updateTeamMemberRole(
      memberId,
      validatedData.role
    )

    if (!member) {
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      )
    }

    return NextResponse.json({ member }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating member role:', error)
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/teams/[teamId]/members/[memberId]
 * Remove a team member
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string; memberId: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId, memberId } = params

    // Check if user is admin or owner
    const isAdmin = await serverTeamService.isTeamAdmin(teamId, user.id)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only team admins can remove members' },
        { status: 403 }
      )
    }

    const success = await serverTeamService.removeTeamMember(memberId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove team member' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error removing team member:', error)
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    )
  }
}
