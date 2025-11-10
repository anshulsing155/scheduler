import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteUserAccount, scheduleAccountDeletion } from '@/services/privacy-service';

/**
 * POST /api/privacy/delete
 * Delete user account and all associated data
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

    const { immediate } = await request.json();

    if (immediate) {
      // Immediate deletion (requires confirmation)
      await deleteUserAccount(user.id);
      
      // Sign out the user
      await supabase.auth.signOut();

      return NextResponse.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } else {
      // Schedule deletion with 30-day grace period
      const deletionDate = await scheduleAccountDeletion(user.id);

      return NextResponse.json({
        success: true,
        message: 'Account deletion scheduled',
        deletionDate,
      });
    }
  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
