import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverEventTypeService, createEventTypeSchema } from '@/services/event-type-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || user.id
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Verify user can access these event types
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const eventTypes = await serverEventTypeService.getEventTypes(userId, includeInactive)

    return NextResponse.json({ eventTypes })
  } catch (error) {
    console.error('Error fetching event types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const validatedData = createEventTypeSchema.parse(body)

    // Create event type
    const eventType = await serverEventTypeService.createEventType(user.id, validatedData)

    if (!eventType) {
      return NextResponse.json({ error: 'Failed to create event type' }, { status: 500 })
    }

    return NextResponse.json({ eventType }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating event type:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
