import { NextRequest, NextResponse } from 'next/server'
import { serverBookingService } from '@/services/booking-service'

/**
 * GET /api/bookings/token/[token] - Get a booking by token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as 'reschedule' | 'cancel'

    if (!type || (type !== 'reschedule' && type !== 'cancel')) {
      return NextResponse.json({ error: 'Invalid token type' }, { status: 400 })
    }

    const booking = await serverBookingService.getBookingByToken(token, type)

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or token invalid' }, { status: 404 })
    }

    // Check if booking can still be modified
    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ error: 'This booking has been cancelled' }, { status: 400 })
    }

    if (new Date(booking.startTime) < new Date()) {
      return NextResponse.json({ error: 'This booking is in the past' }, { status: 400 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error fetching booking by token:', error)
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 })
  }
}
