import { NextRequest, NextResponse } from 'next/server'
import { serverPaymentService, createPaymentIntentSchema } from '@/services/payment-service'
import { createClient } from '@/lib/supabase/server'

/**
 * Create a payment intent for a booking
 * POST /api/payments/create-intent
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // For payment intents, we allow unauthenticated users (guests)
    // The userId will be extracted from the event type
    const body = await request.json()
    
    // Validate the request body
    const validatedData = createPaymentIntentSchema.parse(body)

    // Get the event type to find the user ID
    const { prisma } = await import('@/lib/prisma')
    const eventType = await prisma.eventType.findUnique({
      where: { id: validatedData.eventTypeId },
      select: { userId: true },
    })

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      )
    }

    // Create payment intent
    const result = await serverPaymentService.createPaymentIntent(
      eventType.userId,
      validatedData
    )

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create payment intent' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      clientSecret: result.clientSecret,
      paymentId: result.paymentId,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
