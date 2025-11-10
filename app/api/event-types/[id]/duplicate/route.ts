import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverEventTypeService } from '@/services/event-type-service'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this event type
    const existingEventType = await serverEventTypeService.getEventType(params.id)

    if (!existingEventType) {
      return NextResponse.json({ error: 'Event type not found' }, { status: 404 })
    }

    if (existingEventType.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Duplicate event type
    const eventType = await serverEventTypeService.duplicateEventType(params.id)

    if (!eventType) {
      return NextResponse.json({ error: 'Failed to duplicate event type' }, { status: 500 })
    }

    return NextResponse.json({ eventType }, { status: 201 })
  } catch (error) {
    console.error('Error duplicating event type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
