import { NextRequest, NextResponse } from 'next/server';
import { calendarService } from '@/services/calendar-service';
import { createClient } from '@/lib/supabase/server';

/**
 * Disconnect a calendar
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { calendarId } = await request.json();

    if (!calendarId) {
      return NextResponse.json(
        { error: 'Calendar ID is required' },
        { status: 400 }
      );
    }

    await calendarService.disconnectCalendar(user.id, calendarId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect calendar' },
      { status: 500 }
    );
  }
}
