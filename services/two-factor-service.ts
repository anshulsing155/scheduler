import { prisma } from '@/lib/prisma';
import {
  generateTotpSecret,
  generateTotpQrCodeUrl,
  verifyTotpCode,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  encryptTotpSecret,
  decryptTotpSecret,
} from '@/lib/security/two-factor';

export interface TwoFactorSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

/**
 * Initialize 2FA setup for a user
 */
export async function initializeTwoFactor(
  userId: string,
  email: string
): Promise<TwoFactorSetupResult> {
  // Generate secret and backup codes
  const secret = generateTotpSecret();
  const backupCodes = generateBackupCodes(10);
  const qrCodeUrl = generateTotpQrCodeUrl(secret, email);

  return {
    secret,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Enable 2FA for a user after verification
 */
export async function enableTwoFactor(
  userId: string,
  secret: string,
  code: string,
  backupCodes: string[]
): Promise<boolean> {
  // Verify the code first
  if (!verifyTotpCode(secret, code)) {
    throw new Error('Invalid verification code');
  }

  // Encrypt secret for storage
  const encryptedSecret = encryptTotpSecret(secret);

  // Hash backup codes for storage
  const hashedBackupCodes = backupCodes.map(hashBackupCode);

  // Update user in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: encryptedSecret,
      backupCodes: hashedBackupCodes,
    },
  });

  return true;
}

/**
 * Disable 2FA for a user
 */
export async function disableTwoFactor(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: null,
    },
  });
}

/**
 * Verify 2FA code for a user
 */
export async function verifyTwoFactorCode(
  userId: string,
  code: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorEnabled: true,
      twoFactorSecret: true,
      backupCodes: true,
    },
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return false;
  }

  // Decrypt secret
  const secret = decryptTotpSecret(user.twoFactorSecret);

  // Try TOTP code first
  if (verifyTotpCode(secret, code)) {
    return true;
  }

  // Try backup codes if TOTP fails
  if (user.backupCodes && Array.isArray(user.backupCodes)) {
    const hashedCodes = user.backupCodes as string[];
    
    if (verifyBackupCode(code, hashedCodes)) {
      // Remove used backup code
      const hashedInput = hashBackupCode(code);
      const updatedCodes = hashedCodes.filter(
        (hashed) => hashed !== hashedInput
      );

      await prisma.user.update({
        where: { id: userId },
        data: { backupCodes: updatedCodes },
      });

      return true;
    }
  }

  return false;
}

/**
 * Check if user has 2FA enabled
 */
export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });

  return user?.twoFactorEnabled || false;
}

/**
 * Generate new backup codes for a user
 */
export async function regenerateBackupCodes(
  userId: string
): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });

  if (!user || !user.twoFactorEnabled) {
    throw new Error('2FA is not enabled for this user');
  }

  const backupCodes = generateBackupCodes(10);
  const hashedBackupCodes = backupCodes.map(hashBackupCode);

  await prisma.user.update({
    where: { id: userId },
    data: { backupCodes: hashedBackupCodes },
  });

  return backupCodes;
}

/**
 * Get remaining backup codes count
 */
export async function getRemainingBackupCodesCount(
  userId: string
): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { backupCodes: true },
  });

  if (!user || !user.backupCodes || !Array.isArray(user.backupCodes)) {
    return 0;
  }

  return user.backupCodes.length;
}
