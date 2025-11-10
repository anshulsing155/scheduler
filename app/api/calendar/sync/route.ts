import { NextRequest, NextResponse } from 'next/server';
import { calendarService } from '@/services/calendar-service';
import { createClient } from '@/lib/supabase/server';

/**
 * Sync calendar events for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Sync events for the next 30 days
    const events = await calendarService.syncCalendarEvents(user.id, 30);

    return NextResponse.json({ 
      success: true,
      eventCount: events.length,
      events: events.slice(0, 10), // Return first 10 events as preview
    });
  } catch (error) {
    console.error('Error syncing calendars:', error);
    return NextResponse.json(
      { error: 'Failed to sync calendars' },
      { status: 500 }
    );
  }
}
