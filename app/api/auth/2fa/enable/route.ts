import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enableTwoFactor } from '@/services/two-factor-service';

/**
 * POST /api/auth/2fa/enable
 * Enable 2FA for the current user after verification
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { secret, code, backupCodes } = await request.json();

    if (!secret || !code || !backupCodes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await enableTwoFactor(user.id, secret, code, backupCodes);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enable 2FA' },
      { status: 400 }
    );
  }
}
