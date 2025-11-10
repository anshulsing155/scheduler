import { NextRequest, NextResponse } from 'next/server'
import { serverBookingService } from '@/services/booking-service'

/**
 * GET /api/bookings/[bookingId] - Get a booking by ID
 */
export async function GET(request: NextRequest, { params }: { params: { bookingId: string } }) {
  try {
    const { bookingId } = params

    const booking = await serverBookingService.getBooking(bookingId)

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 })
  }
}
