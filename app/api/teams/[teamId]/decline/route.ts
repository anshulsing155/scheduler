import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/protected-route'
import { serverTeamService } from '@/services/team-service'

/**
 * POST /api/teams/[teamId]/decline
 * Decline a team invitation
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

    const success = await serverTeamService.declineTeamInvitation(teamId, user.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to decline invitation. You may not have a pending invitation.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error declining team invitation:', error)
    return NextResponse.json(
      { error: 'Failed to decline invitation' },
      { status: 500 }
    )
  }
}
