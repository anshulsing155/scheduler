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
      return NextResponse.json({ verified: false, error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const domain = searchParams.get('domain')

    if (!domain) {
      return NextResponse.json({ verified: false, error: 'Domain is required' }, { status: 400 })
    }

    const result = await serverDomainService.verifyDomain(domain)

    return NextResponse.json({
      verified: result.verified,
      status: result.status,
      message: result.message,
      dnsRecords: result.dnsRecords,
    })
  } catch (error) {
    console.error('Error verifying domain:', error)
    return NextResponse.json(
      { verified: false, error: 'Failed to verify domain' },
      { status: 500 }
    )
  }
}
