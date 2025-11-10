import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const notificationSettingsSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  phoneNumber: z.string().nullable().optional(),
  reminderTiming: z.array(z.number()).min(1).max(5),
})

/**
 * GET /api/notifications/settings - Get user's notification settings
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create notification settings
    let settings = await prisma.notificationSetting.findUnique({
      where: { userId: user.id },
    })

    if (!settings) {
      // Create default settings
      settings = await prisma.notificationSetting.create({
        data: {
          userId: user.id,
          emailEnabled: true,
          smsEnabled: false,
          phoneNumber: null,
          reminderTiming: [1440, 60], // 24 hours and 1 hour before
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications/settings - Update user's notification settings
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = notificationSettingsSchema.parse(body)

    // Update or create settings
    const settings = await prisma.notificationSetting.upsert({
      where: { userId: user.id },
      update: validatedData,
      create: {
        userId: user.id,
        ...validatedData,
      },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error updating notification settings:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    )
  }
}
