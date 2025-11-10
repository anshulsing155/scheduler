import { createClient } from '@/lib/supabase/server'
import { serverAuthService } from '@/services/auth-service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`
    )
  }

  if (code) {
    try {
      const supabase = await createClient()
      
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError)
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
      }

      if (data.user) {
        // Sync user profile to database
        try {
          await serverAuthService.syncUserProfile(
            data.user.id,
            data.user.email!,
            data.user.user_metadata
          )
        } catch (syncError) {
          console.error('Error syncing user profile:', syncError)
          // Continue even if profile sync fails - can be retried later
        }
      }
      
      // Determine redirect URL
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.error('Unexpected error in OAuth callback:', error)
      return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }
  }

  // No code provided
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
