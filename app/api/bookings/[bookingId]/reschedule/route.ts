import { NextRequest, NextResponse } from 'next/server'
import { serverBookingService, rescheduleBookingSchema } from '@/services/booking-service'
import { emailService } from '@/services/email-service'
import { z } from 'zod'

/**
 * POST /api/bookings/[bookingId]/reschedule - Reschedule a booking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params
    const body = await request.json()

    // Get the old booking details before rescheduling
    const oldBooking = await serverBookingService.getBooking(bookingId)
    if (!oldBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    const oldStartTime = oldBooking.startTime

    // Validate request body
    const validatedData = rescheduleBookingSchema.parse(body)

    // Reschedule booking
    const booking = await serverBookingService.rescheduleBooking(bookingId, validatedData)

    if (!booking) {
      return NextResponse.json({ error: 'Failed to reschedule booking' }, { status: 500 })
    }

    // Send reschedule notification emails to both host and guest (don't block on this)
    emailService.sendRescheduleNotice(booking, oldStartTime).catch((error) => {
      console.error('Failed to send reschedule notice:', error)
    })

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error rescheduling booking:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
