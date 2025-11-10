import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';

export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        metadata: entry.metadata,
      },
    });
  } catch (error) {
    // Don't throw errors for audit logging failures
    // Just log them to prevent disrupting the main flow
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    action?: AuditAction;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const where: any = { userId };

  if (options?.action) {
    where.action = options.action;
  }

  if (options?.resource) {
    where.resource = options.resource;
  }

  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options.startDate) {
      where.createdAt.gte = options.startDate;
    }
    if (options.endDate) {
      where.createdAt.lte = options.endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Get recent security events for a user
 */
export async function getSecurityEvents(userId: string, limit: number = 10) {
  const securityActions = [
    'LOGIN_SUCCESS',
    'LOGIN_FAILED',
    'PASSWORD_RESET',
    'PASSWORD_CHANGED',
    'TWO_FACTOR_ENABLED',
    'TWO_FACTOR_DISABLED',
    'SECURITY_ALERT',
    'SUSPICIOUS_ACTIVITY',
  ];

  return await prisma.auditLog.findMany({
    where: {
      userId,
      action: { in: securityActions as AuditAction[] },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get login history for a user
 */
export async function getLoginHistory(userId: string, limit: number = 20) {
  return await prisma.auditLog.findMany({
    where: {
      userId,
      action: { in: ['LOGIN_SUCCESS', 'LOGIN_FAILED'] },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      action: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
    },
  });
}

/**
 * Detect suspicious activity
 */
export async function detectSuspiciousActivity(userId: string): Promise<boolean> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Check for multiple failed login attempts
  const failedLogins = await prisma.auditLog.count({
    where: {
      userId,
      action: 'LOGIN_FAILED',
      createdAt: { gte: oneHourAgo },
    },
  });

  if (failedLogins >= 5) {
    await createAuditLog({
      userId,
      action: 'SUSPICIOUS_ACTIVITY',
      resource: 'authentication',
      metadata: {
        reason: 'Multiple failed login attempts',
        count: failedLogins,
      },
    });
    return true;
  }

  // Check for logins from multiple IPs in short time
  const recentLogins = await prisma.auditLog.findMany({
    where: {
      userId,
      action: 'LOGIN_SUCCESS',
      createdAt: { gte: oneHourAgo },
    },
    select: { ipAddress: true },
  });

  const uniqueIps = new Set(recentLogins.map((log) => log.ipAddress));
  if (uniqueIps.size >= 3) {
    await createAuditLog({
      userId,
      action: 'SUSPICIOUS_ACTIVITY',
      resource: 'authentication',
      metadata: {
        reason: 'Multiple IPs in short time',
        ipCount: uniqueIps.size,
      },
    });
    return true;
  }

  return false;
}

/**
 * Send security alert to user
 */
export async function sendSecurityAlert(
  userId: string,
  alertType: string,
  details: Record<string, any>
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'SECURITY_ALERT',
    resource: 'security',
    metadata: {
      alertType,
      ...details,
    },
  });

  // In a real implementation, you would also:
  // 1. Send email notification
  // 2. Send SMS if enabled
  // 3. Show in-app notification
}

/**
 * Get audit log statistics
 */
export async function getAuditStatistics(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const logs = await prisma.auditLog.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      action: true,
      resource: true,
    },
  });

  // Group by action
  const actionCounts: Record<string, number> = {};
  const resourceCounts: Record<string, number> = {};

  logs.forEach((log) => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
  });

  return {
    total: logs.length,
    byAction: actionCounts,
    byResource: resourceCounts,
  };
}

/**
 * Clean up old audit logs (data retention)
 */
export async function cleanupOldAuditLogs(retentionDays: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}
