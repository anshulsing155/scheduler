import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { PaymentStatus } from '@prisma/client'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
})

/**
 * Validation Schemas
 */

export const createPaymentIntentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(3).max(3).default('USD'),
  eventTypeId: z.string().min(1, 'Event type is required'),
  guestEmail: z.string().email('Invalid email address'),
  guestName: z.string().min(1, 'Name is required'),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const processRefundSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  amount: z.number().positive('Amount must be positive').optional(),
  reason: z.string().max(500, 'Reason is too long').optional(),
})

export type CreatePaymentIntentData = z.infer<typeof createPaymentIntentSchema>
export type ProcessRefundData = z.infer<typeof processRefundSchema>

export type PaymentWithRelations = {
  id: string
  userId: string
  amount: number
  currency: string
  status: PaymentStatus
  stripePaymentIntentId: string | null
  stripeRefundId: string | null
  createdAt: Date
  updatedAt: Date
  booking?: {
    id: string
    guestName: string
    guestEmail: string
    startTime: Date
    endTime: Date
  } | null
}

export type ServiceResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Client-side payment service
 */
export const paymentService = {
  /**
   * Create a payment intent for a booking
   */
  async createPaymentIntent(data: CreatePaymentIntentData): Promise<ServiceResult<{ clientSecret: string; paymentId: string }>> {
    try {
      const validatedData = createPaymentIntentSchema.parse(data)

      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to create payment intent',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: {
          clientSecret: result.clientSecret,
          paymentId: result.paymentId,
        },
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<ServiceResult<PaymentWithRelations>> {
    try {
      const response = await fetch(`/api/payments/${paymentId}`)

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to fetch payment',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.payment,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(
    userId: string,
    filters?: {
      status?: PaymentStatus
      startDate?: Date
      endDate?: Date
    }
  ): Promise<ServiceResult<PaymentWithRelations[]>> {
    try {
      const params = new URLSearchParams({ userId })

      if (filters?.status) params.append('status', filters.status)
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString())
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString())

      const response = await fetch(`/api/payments?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to fetch payment history',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.payments,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Process a refund
   */
  async processRefund(data: ProcessRefundData): Promise<ServiceResult<void>> {
    try {
      const validatedData = processRefundSchema.parse(data)

      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to process refund',
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },
}

/**
 * Server-side payment service
 */
export const serverPaymentService = {
  /**
   * Create a payment intent with Stripe
   */
  async createPaymentIntent(
    userId: string,
    data: CreatePaymentIntentData
  ): Promise<{ clientSecret: string; paymentId: string } | null> {
    try {
      const validatedData = createPaymentIntentSchema.parse(data)

      // Convert amount to cents for Stripe
      const amountInCents = Math.round(validatedData.amount * 100)

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: validatedData.currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId,
          eventTypeId: validatedData.eventTypeId,
          guestEmail: validatedData.guestEmail,
          guestName: validatedData.guestName,
          ...validatedData.metadata,
        },
      })

      // Create payment record in database
      const payment = await prisma.payment.create({
        data: {
          userId,
          amount: validatedData.amount,
          currency: validatedData.currency,
          status: 'PENDING',
          stripePaymentIntentId: paymentIntent.id,
        },
      })

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentId: payment.id,
      }
    } catch (error) {
      console.error('Error creating payment intent:', error)
      throw error
    }
  },

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<PaymentWithRelations | null> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: {
            select: {
              id: true,
              guestName: true,
              guestEmail: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      })

      return payment as any
    } catch (error) {
      console.error('Error fetching payment:', error)
      return null
    }
  },

  /**
   * Get payment by Stripe payment intent ID
   */
  async getPaymentByStripeId(stripePaymentIntentId: string): Promise<PaymentWithRelations | null> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { stripePaymentIntentId },
        include: {
          booking: {
            select: {
              id: true,
              guestName: true,
              guestEmail: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      })

      return payment as any
    } catch (error) {
      console.error('Error fetching payment by Stripe ID:', error)
      return null
    }
  },

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<boolean> {
    try {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status },
      })

      return true
    } catch (error) {
      console.error('Error updating payment status:', error)
      return false
    }
  },

  /**
   * Process a refund
   */
  async processRefund(data: ProcessRefundData): Promise<boolean> {
    try {
      const validatedData = processRefundSchema.parse(data)

      // Get the booking with payment info
      const booking = await prisma.booking.findUnique({
        where: { id: validatedData.bookingId },
        include: {
          payment: true,
        },
      })

      if (!booking || !booking.payment) {
        throw new Error('Booking or payment not found')
      }

      if (!booking.payment.stripePaymentIntentId) {
        throw new Error('No Stripe payment intent found')
      }

      // Calculate refund amount (default to full amount)
      const refundAmount = validatedData.amount
        ? Math.round(validatedData.amount * 100)
        : Math.round(Number(booking.payment.amount) * 100)

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: booking.payment.stripePaymentIntentId,
        amount: refundAmount,
        reason: validatedData.reason ? 'requested_by_customer' : undefined,
        metadata: {
          bookingId: validatedData.bookingId,
          reason: validatedData.reason || '',
        },
      })

      // Update payment record
      const isFullRefund = refundAmount >= Math.round(Number(booking.payment.amount) * 100)
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          stripeRefundId: refund.id,
        },
      })

      return true
    } catch (error) {
      console.error('Error processing refund:', error)
      throw error
    }
  },

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(
    userId: string,
    filters?: {
      status?: PaymentStatus
      startDate?: Date
      endDate?: Date
    }
  ): Promise<PaymentWithRelations[]> {
    try {
      const where: any = { userId }

      if (filters?.status) {
        where.status = filters.status
      }

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {}
        if (filters.startDate) where.createdAt.gte = filters.startDate
        if (filters.endDate) where.createdAt.lte = filters.endDate
      }

      const payments = await prisma.payment.findMany({
        where,
        include: {
          booking: {
            select: {
              id: true,
              guestName: true,
              guestEmail: true,
              startTime: true,
              endTime: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return payments as any
    } catch (error) {
      console.error('Error fetching payment history:', error)
      return []
    }
  },

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<boolean> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          
          // Update payment status
          const payment = await prisma.payment.findUnique({
            where: { stripePaymentIntentId: paymentIntent.id },
          })

          if (payment) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: 'SUCCEEDED' },
            })
          }
          break
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          
          // Update payment status
          const payment = await prisma.payment.findUnique({
            where: { stripePaymentIntentId: paymentIntent.id },
          })

          if (payment) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: 'FAILED' },
            })
          }
          break
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge
          
          if (charge.payment_intent) {
            const paymentIntentId = typeof charge.payment_intent === 'string' 
              ? charge.payment_intent 
              : charge.payment_intent.id

            const payment = await prisma.payment.findUnique({
              where: { stripePaymentIntentId: paymentIntentId },
            })

            if (payment) {
              const isFullRefund = charge.amount_refunded >= charge.amount
              await prisma.payment.update({
                where: { id: payment.id },
                data: { 
                  status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
                },
              })
            }
          }
          break
        }

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      return true
    } catch (error) {
      console.error('Error handling webhook event:', error)
      return false
    }
  },

  /**
   * Verify Stripe webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event | null {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

      if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured')
      }

      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
      return event
    } catch (error) {
      console.error('Error verifying webhook signature:', error)
      return null
    }
  },
}


/**
 * Cancellation policy helper
 */
export const cancellationPolicyService = {
  /**
   * Calculate refund amount based on cancellation policy
   * Default policy: Full refund if cancelled 24+ hours before, 50% if 12-24 hours, no refund if < 12 hours
   */
  calculateRefundAmount(
    bookingStartTime: Date,
    paymentAmount: number,
    customPolicy?: {
      fullRefundHours?: number
      partialRefundHours?: number
      partialRefundPercentage?: number
    }
  ): { amount: number; percentage: number } {
    const now = new Date()
    const hoursUntilBooking = (bookingStartTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    const fullRefundHours = customPolicy?.fullRefundHours ?? 24
    const partialRefundHours = customPolicy?.partialRefundHours ?? 12
    const partialRefundPercentage = customPolicy?.partialRefundPercentage ?? 50

    if (hoursUntilBooking >= fullRefundHours) {
      // Full refund
      return { amount: paymentAmount, percentage: 100 }
    } else if (hoursUntilBooking >= partialRefundHours) {
      // Partial refund
      const refundAmount = (paymentAmount * partialRefundPercentage) / 100
      return { amount: refundAmount, percentage: partialRefundPercentage }
    } else {
      // No refund
      return { amount: 0, percentage: 0 }
    }
  },

  /**
   * Get cancellation policy description
   */
  getPolicyDescription(customPolicy?: {
    fullRefundHours?: number
    partialRefundHours?: number
    partialRefundPercentage?: number
  }): string {
    const fullRefundHours = customPolicy?.fullRefundHours ?? 24
    const partialRefundHours = customPolicy?.partialRefundHours ?? 12
    const partialRefundPercentage = customPolicy?.partialRefundPercentage ?? 50

    return `Full refund if cancelled ${fullRefundHours}+ hours before the booking. ${partialRefundPercentage}% refund if cancelled ${partialRefundHours}-${fullRefundHours} hours before. No refund if cancelled less than ${partialRefundHours} hours before.`
  },
}
