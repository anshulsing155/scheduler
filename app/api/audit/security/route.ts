import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSecurityEvents, getLoginHistory } from '@/services/audit-service';

/**
 * GET /api/audit/security
 * Get security events and login history for the current user
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

    const [securityEvents, loginHistory] = await Promise.all([
      getSecurityEvents(user.id, 10),
      getLoginHistory(user.id, 20),
    ]);

    return NextResponse.json({
      securityEvents,
      loginHistory,
    });
  } catch (error) {
    console.error('Error fetching security data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security data' },
      { status: 500 }
    );
  }
}
