import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { regenerateBackupCodes, getRemainingBackupCodesCount } from '@/services/two-factor-service';

/**
 * GET /api/auth/2fa/backup-codes
 * Get remaining backup codes count
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

    const count = await getRemainingBackupCodesCount(user.id);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error getting backup codes count:', error);
    return NextResponse.json(
      { error: 'Failed to get backup codes count' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/2fa/backup-codes
 * Regenerate backup codes
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

    const backupCodes = await regenerateBackupCodes(user.id);

    return NextResponse.json({ backupCodes });
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to regenerate backup codes' },
      { status: 500 }
    );
  }
}
