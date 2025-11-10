import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { disableTwoFactor } from '@/services/two-factor-service';

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA for the current user
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await disableTwoFactor(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}
