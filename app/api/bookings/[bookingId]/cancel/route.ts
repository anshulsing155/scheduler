import { NextRequest, NextResponse } from 'next/server'
import { serverBookingService, cancelBookingSchema } from '@/services/booking-service'
import { emailService } from '@/services/email-service'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * POST /api/bookings/[bookingId]/cancel - Cancel a booking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params
    const body = await request.json()

    // Get booking details before cancellation
    const booking = await serverBookingService.getBooking(bookingId)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Determine who is cancelling (host or guest)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const cancelledBy = user && user.id === booking.userId ? 'host' : 'guest'

    // Validate request body
    const validatedData = cancelBookingSchema.parse(body)

    // Cancel booking
    const success = await serverBookingService.cancelBooking(
      bookingId,
      validatedData.reason
    )

    if (!success) {
      return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
    }

    // Get updated booking with cancellation reason
    const updatedBooking = await serverBookingService.getBooking(bookingId)
    if (updatedBooking) {
      // Send cancellation notification emails to both host and guest (don't block on this)
      emailService.sendCancellationNotice(updatedBooking, cancelledBy).catch((error) => {
        console.error('Failed to send cancellation notice:', error)
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling booking:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
