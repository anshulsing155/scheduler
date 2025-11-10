import { NextRequest, NextResponse } from 'next/server';
import { calendarService } from '@/services/calendar-service';
import { createClient } from '@/lib/supabase/server';

/**
 * Get user's connected calendars
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

    const calendars = await calendarService.getConnectedCalendars(user.id);

    // Don't expose sensitive tokens to client
    const sanitizedCalendars = calendars.map(cal => ({
      id: cal.id,
      provider: cal.provider,
      calendarId: cal.calendarId,
      calendarName: cal.calendarName,
      isPrimary: cal.isPrimary,
      createdAt: cal.createdAt,
    }));

    return NextResponse.json({ calendars: sanitizedCalendars });
  } catch (error) {
    console.error('Error fetching calendars:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendars' },
      { status: 500 }
    );
  }
}
