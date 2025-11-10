import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exportUserData } from '@/services/privacy-service';

/**
 * GET /api/privacy/export
 * Export all user data (GDPR compliance)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await exportUserData(user.id);

    // Return as JSON file download
    const json = JSON.stringify(userData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-${user.id}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}
