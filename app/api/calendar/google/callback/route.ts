import { NextRequest, NextResponse } from 'next/server';
import { calendarService } from '@/services/calendar-service';

/**
 * Handle Google Calendar OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings/calendars?error=${error}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/calendars?error=missing_params', request.url)
      );
    }

    // Decode state to get user ID
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const userId = stateData.userId;

    if (!userId) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/calendars?error=invalid_state', request.url)
      );
    }

    // Connect the calendar
    await calendarService.connectGoogleCalendar(userId, code);

    // Redirect back to settings with success message
    return NextResponse.redirect(
      new URL('/dashboard/settings/calendars?success=true', request.url)
    );
  } catch (error) {
    console.error('Error handling Google Calendar callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings/calendars?error=connection_failed', request.url)
    );
  }
}
