import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverEventTypeService } from '@/services/event-type-service'

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
    const slug = searchParams.get('slug')
    const excludeEventTypeId = searchParams.get('excludeEventTypeId') || undefined

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    // Verify user can check this
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const available = await serverEventTypeService.isSlugAvailable(userId, slug, excludeEventTypeId)

    return NextResponse.json({ available })
  } catch (error) {
    console.error('Error checking slug availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
