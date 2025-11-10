import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/services/notification-service'

/**
 * GET /api/cron/process-reminders - Process pending reminders
 * 
 * This endpoint should be called by a cron job every minute.
 * For Vercel, configure this in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-reminders",
 *     "schedule": "* * * * *"
 *   }]
 * }
 * 
 * For local development, you can use a service like cron-job.org
 * or set up a local cron job to call this endpoint.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron job (optional security measure)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Process pending reminders
    const processedCount = await notificationService.processPendingReminders()
    
    // Retry failed reminders
    const retriedCount = await notificationService.retryFailedReminders()

    return NextResponse.json({
      success: true,
      processedCount,
      retriedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in cron job:', error)
    return NextResponse.json(
      {
        error: 'Failed to process reminders',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Allow POST as well for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
