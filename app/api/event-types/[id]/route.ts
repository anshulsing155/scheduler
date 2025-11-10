import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverEventTypeService, updateEventTypeSchema } from '@/services/event-type-service'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventType = await serverEventTypeService.getEventType(params.id)

    if (!eventType) {
      return NextResponse.json({ error: 'Event type not found' }, { status: 404 })
    }

    // Verify user owns this event type
    if (eventType.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ eventType })
  } catch (error) {
    console.error('Error fetching event type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const body = await request.json()

    // Validate request body
    const validatedData = updateEventTypeSchema.parse(body)

    // Update event type
    const eventType = await serverEventTypeService.updateEventType(params.id, validatedData)

    if (!eventType) {
      return NextResponse.json({ error: 'Failed to update event type' }, { status: 500 })
    }

    return NextResponse.json({ eventType })
  } catch (error: any) {
    console.error('Error updating event type:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Delete event type
    const success = await serverEventTypeService.deleteEventType(params.id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete event type' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
