import { NextRequest, NextResponse } from 'next/server'
import { serverPaymentService, processRefundSchema } from '@/services/payment-service'
import { createClient } from '@/lib/supabase/server'

/**
 * Process a refund for a booking
 * POST /api/payments/refund
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = processRefundSchema.parse(body)

    // Verify the user owns the booking
    const { prisma } = await import('@/lib/prisma')
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      select: { userId: true },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Process the refund
    await serverPaymentService.processRefund(validatedData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing refund:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process refund' },
      { status: 500 }
    )
  }
}
