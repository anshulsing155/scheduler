import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverAuthService } from '@/services/auth-service'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get('token')
  const type = searchParams.get('type') || 'signup'
  const next = searchParams.get('next') ?? '/dashboard'

  if (!token) {
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=missing_token`
    )
  }

  try {
    const supabase = await createClient()

    // Verify the email token
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type === 'signup' ? 'email' : 'email_change',
    })

    if (error) {
      console.error('Email verification error:', error)
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=verification_failed&description=${encodeURIComponent(error.message)}`
      )
    }

    if (data.user) {
      // Sync user profile if not already synced
      try {
        await serverAuthService.syncUserProfile(
          data.user.id,
          data.user.email!,
          data.user.user_metadata
        )
      } catch (syncError) {
        console.error('Error syncing user profile:', syncError)
        // Continue even if profile sync fails
      }
    }

    // Redirect to success page or dashboard
    return NextResponse.redirect(`${origin}${next}`)
  } catch (error) {
    console.error('Unexpected error verifying email:', error)
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=unexpected_error`
    )
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Resend verification email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/dashboard`,
      },
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resending verification email:', error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}
