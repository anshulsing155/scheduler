import { NextRequest, NextResponse } from 'next/server';
import { OutlookCalendarService } from '@/lib/calendar/outlook-calendar';
import { createClient } from '@/lib/supabase/server';

/**
 * Initiate Microsoft Outlook OAuth flow
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

    const outlookService = new OutlookCalendarService({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: 'common',
      redirectUri: `${process.env.NEXTAUTH_URL}/api/calendar/outlook/callback`,
    });

    // Generate state parameter with user ID for security
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');
    
    const authUrl = outlookService.getAuthorizationUrl(state);

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error('Error initiating Outlook connection:', error);
    return NextResponse.json(
      { error: 'Failed to initiate calendar connection' },
      { status: 500 }
    );
  }
}
