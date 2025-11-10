import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/protected-route'
import { serverAnalyticsService } from '@/services/analytics-service'
import { z } from 'zod'

const dateRangeSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start date format',
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid end date format',
  }),
})

/**
 * GET /api/analytics/trends
 * Get booking trends over time for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validatedParams = dateRangeSchema.parse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    })

    const dateRange = {
      startDate: new Date(validatedParams.startDate),
      endDate: new Date(validatedParams.endDate),
    }

    const trends = await serverAnalyticsService.getBookingTrends(user.id, dateRange)

    return NextResponse.json(trends, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Error fetching booking trends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking trends' },
      { status: 500 }
    )
  }
}
