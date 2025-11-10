import { prisma } from '@/lib/prisma';

/**
 * Export all user data for GDPR compliance
 */
export async function exportUserData(userId: string): Promise<any> {
  // Fetch all user-related data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      eventTypes: true,
      bookings: {
        include: {
          eventType: true,
          payment: true,
          reminders: true,
        },
      },
      availability: true,
      dateOverrides: true,
      connectedCalendars: {
        select: {
          provider: true,
          calendarName: true,
          isPrimary: true,
          createdAt: true,
          // Exclude sensitive tokens
        },
      },
      teamMemberships: {
        include: {
          team: true,
        },
      },
      notifications: true,
      payments: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Remove sensitive fields
  const sanitizedUser = {
    ...user,
    twoFactorSecret: undefined,
    backupCodes: undefined,
  };

  // Format data for export
  return {
    exportDate: new Date().toISOString(),
    user: sanitizedUser,
    summary: {
      totalEventTypes: user.eventTypes.length,
      totalBookings: user.bookings.length,
      totalPayments: user.payments.length,
      accountCreated: user.createdAt,
    },
  };
}

/**
 * Delete user account and all associated data
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  // Delete in order to respect foreign key constraints
  // Most relations have onDelete: Cascade, but we'll be explicit

  await prisma.$transaction(async (tx) => {
    // Delete reminders for user's bookings
    await tx.reminder.deleteMany({
      where: {
        booking: {
          userId,
        },
      },
    });

    // Delete bookings (as host)
    await tx.booking.deleteMany({
      where: { userId },
    });

    // Delete payments
    await tx.payment.deleteMany({
      where: { userId },
    });

    // Delete notification settings
    await tx.notificationSetting.deleteMany({
      where: { userId },
    });

    // Delete team memberships
    await tx.teamMember.deleteMany({
      where: { userId },
    });

    // Delete connected calendars
    await tx.connectedCalendar.deleteMany({
      where: { userId },
    });

    // Delete date overrides
    await tx.dateOverride.deleteMany({
      where: { userId },
    });

    // Delete availability
    await tx.availability.deleteMany({
      where: { userId },
    });

    // Delete event types (will cascade to bookings)
    await tx.eventType.deleteMany({
      where: { userId },
    });

    // Finally, delete the user
    await tx.user.delete({
      where: { id: userId },
    });
  });
}

/**
 * Anonymize user data (alternative to deletion)
 */
export async function anonymizeUserData(userId: string): Promise<void> {
  const anonymousEmail = `deleted-${userId}@anonymous.local`;
  const anonymousUsername = `deleted-${userId.slice(0, 8)}`;

  await prisma.user.update({
    where: { id: userId },
    data: {
      email: anonymousEmail,
      username: anonymousUsername,
      name: 'Deleted User',
      bio: null,
      avatarUrl: null,
      brandColor: null,
      logoUrl: null,
      customDomain: null,
      customCSS: null,
      customFooter: null,
      customHeader: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: null,
    },
  });

  // Anonymize bookings as guest
  await prisma.booking.updateMany({
    where: { guestEmail: { contains: userId } },
    data: {
      guestName: 'Anonymous',
      guestEmail: anonymousEmail,
      guestPhone: null,
      customResponses: null,
    },
  });
}

/**
 * Get user consent status
 */
export async function getUserConsent(userId: string): Promise<{
  dataProcessing: boolean;
  marketing: boolean;
  analytics: boolean;
}> {
  // This would typically be stored in a separate consent table
  // For now, we'll return default values
  return {
    dataProcessing: true, // Required for service
    marketing: false,
    analytics: false,
  };
}

/**
 * Update user consent preferences
 */
export async function updateUserConsent(
  userId: string,
  consent: {
    dataProcessing?: boolean;
    marketing?: boolean;
    analytics?: boolean;
  }
): Promise<void> {
  // This would typically update a consent table
  // For now, we'll just validate the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // In a real implementation, you would store this in a consent table
  // with timestamps for audit purposes
}

/**
 * Get data retention policy information
 */
export function getDataRetentionPolicy(): {
  activeData: string;
  deletedAccounts: string;
  backups: string;
} {
  return {
    activeData: 'Data is retained while your account is active',
    deletedAccounts: 'Account data is permanently deleted within 30 days of account deletion',
    backups: 'Backup data is retained for 90 days for disaster recovery purposes',
  };
}

/**
 * Schedule account deletion (30-day grace period)
 */
export async function scheduleAccountDeletion(userId: string): Promise<Date> {
  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + 30);

  // In a real implementation, you would:
  // 1. Mark the account for deletion
  // 2. Set up a scheduled job to delete after 30 days
  // 3. Send confirmation email
  // 4. Allow user to cancel within grace period

  return deletionDate;
}

/**
 * Cancel scheduled account deletion
 */
export async function cancelAccountDeletion(userId: string): Promise<void> {
  // In a real implementation, you would:
  // 1. Remove deletion flag
  // 2. Cancel scheduled job
  // 3. Send confirmation email

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }
}
