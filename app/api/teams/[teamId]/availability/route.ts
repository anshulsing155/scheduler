import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/protected-route'
import { serverTeamService, serverTeamAvailabilityService, TeamAvailabilityMode } from '@/services/team-service'
import { z } from 'zod'

const availabilityQuerySchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  duration: z.string().transform((val) => parseInt(val, 10)),
  timezone: z.string(),
  mode: z.enum(['COLLECTIVE', 'ROUND_ROBIN']).optional().default('COLLECTIVE'),
  eventTypeId: z.string().optional(),
})

/**
 * GET /api/teams/[teamId]/availability
 * Get team availability for a specific date
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
    
    // Validate query parameters
    const validatedParams = availabilityQuerySchema.parse({
      date: searchParams.get('date'),
      duration: searchParams.get('duration'),
      timezone: searchParams.get('timezone'),
      mode: searchParams.get('mode') || 'COLLECTIVE',
      eventTypeId: searchParams.get('eventTypeId'),
    })

    const date = new Date(validatedParams.date)
    const { duration, timezone, mode, eventTypeId } = validatedParams

    const availability = await serverTeamAvailabilityService.getTeamAvailability(
      teamId,
      date,
      duration,
      timezone,
      mode as TeamAvailabilityMode,
      eventTypeId
    )

    return NextResponse.json(availability, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Error fetching team availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team availability' },
      { status: 500 }
    )
  }
}
