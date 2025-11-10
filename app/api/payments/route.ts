import { NextRequest, NextResponse } from 'next/server'
import { serverPaymentService } from '@/services/payment-service'
import { createClient } from '@/lib/supabase/server'
import { PaymentStatus } from '@prisma/client'

/**
 * Get payment history for a user
 * GET /api/payments?userId=xxx&status=xxx&startDate=xxx&endDate=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') as PaymentStatus | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Verify the user is requesting their own payments
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const filters: any = {}
    if (status) filters.status = status
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)

    const payments = await serverPaymentService.getPaymentHistory(userId, filters)

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error fetching payment history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    )
  }
}
