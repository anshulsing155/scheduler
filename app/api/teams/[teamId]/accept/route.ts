import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/protected-route'
import { serverTeamService } from '@/services/team-service'

/**
 * POST /api/teams/[teamId]/accept
 * Accept a team invitation
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

    const member = await serverTeamService.acceptTeamInvitation(teamId, user.id)

    if (!member) {
      return NextResponse.json(
        { error: 'Failed to accept invitation. You may not have a pending invitation.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ member }, { status: 200 })
  } catch (error) {
    console.error('Error accepting team invitation:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
