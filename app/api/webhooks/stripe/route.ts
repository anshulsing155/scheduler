import { NextRequest, NextResponse } from 'next/server'
import { serverPaymentService } from '@/services/payment-service'

/**
 * Stripe webhook endpoint
 * Handles payment events from Stripe
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text
    const body = await request.text()
    
    // Get the Stripe signature from headers
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify the webhook signature
    const event = serverPaymentService.verifyWebhookSignature(body, signature)

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    const handled = await serverPaymentService.handleWebhookEvent(event)

    if (!handled) {
      return NextResponse.json(
        { error: 'Failed to handle webhook event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
