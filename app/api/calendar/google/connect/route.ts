import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarService } from '@/lib/calendar/google-calendar';
import { createClient } from '@/lib/supabase/server';

/**
 * Initiate Google Calendar OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const googleService = new GoogleCalendarService({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXTAUTH_URL}/api/calendar/google/callback`,
    });

    // Generate state parameter with user ID for security
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');
    
    const authUrl = googleService.getAuthorizationUrl(state);

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error('Error initiating Google Calendar connection:', error);
    return NextResponse.json(
      { error: 'Failed to initiate calendar connection' },
      { status: 500 }
    );
  }
}
