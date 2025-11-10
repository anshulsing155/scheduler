import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserConsent, updateUserConsent } from '@/services/privacy-service';

/**
 * GET /api/privacy/consent
 * Get user consent preferences
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

    const consent = await getUserConsent(user.id);

    return NextResponse.json(consent);
  } catch (error) {
    console.error('Error getting user consent:', error);
    return NextResponse.json(
      { error: 'Failed to get consent preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/privacy/consent
 * Update user consent preferences
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

    const consent = await request.json();

    await updateUserConsent(user.id, consent);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user consent:', error);
    return NextResponse.json(
      { error: 'Failed to update consent preferences' },
      { status: 500 }
    );
  }
}
