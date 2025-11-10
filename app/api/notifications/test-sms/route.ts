import { NextRequest, NextResponse } from 'next/server'
import { smsService } from '@/services/sms-service'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/notifications/test-sms - Send a test SMS
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { phoneNumber } = body

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Send test SMS
    const result = await smsService.sendTestSMS(phoneNumber)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Test SMS sent successfully' })
  } catch (error) {
    console.error('Error sending test SMS:', error)
    return NextResponse.json(
      {
        error: 'Failed to send test SMS',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
