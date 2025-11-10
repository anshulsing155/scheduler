import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/protected-route'
import { serverTeamService, updateTeamSchema } from '@/services/team-service'
import { z } from 'zod'

/**
 * GET /api/teams/[teamId]
 * Get a specific team by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId } = params

    const team = await serverTeamService.getTeam(teamId)

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if user is a member of the team
    const isMember = await serverTeamService.isTeamMember(teamId, user.id)
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ team }, { status: 200 })
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/teams/[teamId]
 * Update a team
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId } = params

    // Check if user is admin or owner
    const isAdmin = await serverTeamService.isTeamAdmin(teamId, user.id)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only team admins can update team settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validatedData = updateTeamSchema.parse(body)

    const team = await serverTeamService.updateTeam(teamId, validatedData)

    if (!team) {
      return NextResponse.json(
        { error: 'Failed to update team' },
        { status: 500 }
      )
    }

    return NextResponse.json({ team }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating team:', error)
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/teams/[teamId]
 * Delete a team
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId } = params

    // Check if user is the owner
    const isOwner = await serverTeamService.isTeamOwner(teamId, user.id)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only team owners can delete teams' },
        { status: 403 }
      )
    }

    const success = await serverTeamService.deleteTeam(teamId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete team' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    )
  }
}
