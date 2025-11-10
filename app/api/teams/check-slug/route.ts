import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/protected-route'
import { serverTeamService } from '@/services/team-service'

/**
 * GET /api/teams/check-slug
 * Check if a team slug is available
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const excludeTeamId = searchParams.get('excludeTeamId')

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    const available = await serverTeamService.isSlugAvailable(
      slug,
      excludeTeamId || undefined
    )

    return NextResponse.json({ available }, { status: 200 })
  } catch (error) {
    console.error('Error checking slug availability:', error)
    return NextResponse.json(
      { error: 'Failed to check slug availability' },
      { status: 500 }
    )
  }
}
