import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/protected-route'
import { serverTeamService, inviteTeamMemberSchema } from '@/services/team-service'
import { z } from 'zod'

/**
 * GET /api/teams/[teamId]/members
 * Get all members of a team
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

    // Check if user is a member of the team
    const isMember = await serverTeamService.isTeamMember(teamId, user.id)
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeUnaccepted = searchParams.get('includeUnaccepted') === 'true'

    const members = await serverTeamService.getTeamMembers(teamId, includeUnaccepted)

    return NextResponse.json({ members }, { status: 200 })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/teams/[teamId]/members
 * Invite a new team member
 */
export async function POST(
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
        { error: 'Only team admins can invite members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validatedData = inviteTeamMemberSchema.parse(body)

    const member = await serverTeamService.inviteTeamMember(
      teamId,
      validatedData.email,
      validatedData.role
    )

    if (!member) {
      return NextResponse.json(
        { error: 'Failed to invite team member. User may not exist or is already a member.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Error inviting team member:', error)
    return NextResponse.json(
      { error: 'Failed to invite team member' },
      { status: 500 }
    )
  }
}
