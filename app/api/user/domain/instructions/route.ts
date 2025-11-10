import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverDomainService } from '@/services/domain-service.server'

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
    const domain = searchParams.get('domain')

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    const instructions = serverDomainService.getDNSInstructions(domain)

    return NextResponse.json(instructions)
  } catch (error) {
    console.error('Error fetching DNS instructions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch DNS instructions' },
      { status: 500 }
    )
  }
}
