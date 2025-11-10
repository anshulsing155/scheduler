import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initializeTwoFactor } from '@/services/two-factor-service';

/**
 * POST /api/auth/2fa/setup
 * Initialize 2FA setup for the current user
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

    const result = await initializeTwoFactor(user.id, user.email!);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error initializing 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to initialize 2FA' },
      { status: 500 }
    );
  }
}
