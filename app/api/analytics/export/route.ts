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
  format: z.enum(['json', 'csv']).optional().default('csv'),
})

/**
 * GET /api/analytics/export
 * Export booking data for the authenticated user
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
      format: searchParams.get('format') || 'csv',
    })

    const dateRange = {
      startDate: new Date(validatedParams.startDate),
      endDate: new Date(validatedParams.endDate),
    }

    const bookingData = await serverAnalyticsService.exportBookingData(user.id, dateRange)

    if (validatedParams.format === 'json') {
      return NextResponse.json(bookingData, { status: 200 })
    }

    // Convert to CSV
    if (bookingData.length === 0) {
      return new NextResponse('No data to export', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="bookings-export.csv"',
        },
      })
    }

    const headers = Object.keys(bookingData[0])
    const csvRows = [
      headers.join(','),
      ...bookingData.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            // Escape values that contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .join(',')
      ),
    ]

    const csv = csvRows.join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="bookings-export.csv"',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Error exporting booking data:', error)
    return NextResponse.json(
      { error: 'Failed to export booking data' },
      { status: 500 }
    )
  }
}
