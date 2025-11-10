import { NextRequest } from 'next/server';
import { createAuditLog } from '@/services/audit-service';
import { AuditAction } from '@prisma/client';

/**
 * Extract client information from request
 */
export function getClientInfo(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');

  let ipAddress = request.ip || 'unknown';
  if (forwardedFor) {
    ipAddress = forwardedFor.split(',')[0].trim();
  } else if (realIp) {
    ipAddress = realIp;
  }

  return {
    ipAddress,
    userAgent: userAgent || undefined,
  };
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
  action: Extract<
    AuditAction,
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'LOGOUT'
    | 'PASSWORD_RESET'
    | 'PASSWORD_CHANGED'
    | 'TWO_FACTOR_ENABLED'
    | 'TWO_FACTOR_DISABLED'
  >,
  userId: string | undefined,
  request: NextRequest,
  metadata?: Record<string, any>
) {
  const { ipAddress, userAgent } = getClientInfo(request);

  await createAuditLog({
    userId,
    action,
    resource: 'authentication',
    ipAddress,
    userAgent,
    metadata,
  });
}

/**
 * Log user management event
 */
export async function logUserEvent(
  action: Extract<AuditAction, 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED'>,
  userId: string,
  request?: NextRequest,
  metadata?: Record<string, any>
) {
  const clientInfo = request ? getClientInfo(request) : {};

  await createAuditLog({
    userId,
    action,
    resource: 'user',
    resourceId: userId,
    ...clientInfo,
    metadata,
  });
}

/**
 * Log booking event
 */
export async function logBookingEvent(
  action: Extract<
    AuditAction,
    'BOOKING_CREATED' | 'BOOKING_UPDATED' | 'BOOKING_CANCELLED' | 'BOOKING_RESCHEDULED'
  >,
  userId: string,
  bookingId: string,
  request?: NextRequest,
  metadata?: Record<string, any>
) {
  const clientInfo = request ? getClientInfo(request) : {};

  await createAuditLog({
    userId,
    action,
    resource: 'booking',
    resourceId: bookingId,
    ...clientInfo,
    metadata,
  });
}

/**
 * Log event type event
 */
export async function logEventTypeEvent(
  action: Extract<
    AuditAction,
    'EVENT_TYPE_CREATED' | 'EVENT_TYPE_UPDATED' | 'EVENT_TYPE_DELETED'
  >,
  userId: string,
  eventTypeId: string,
  request?: NextRequest,
  metadata?: Record<string, any>
) {
  const clientInfo = request ? getClientInfo(request) : {};

  await createAuditLog({
    userId,
    action,
    resource: 'event_type',
    resourceId: eventTypeId,
    ...clientInfo,
    metadata,
  });
}

/**
 * Log payment event
 */
export async function logPaymentEvent(
  action: Extract<AuditAction, 'PAYMENT_PROCESSED' | 'PAYMENT_REFUNDED'>,
  userId: string,
  paymentId: string,
  request?: NextRequest,
  metadata?: Record<string, any>
) {
  const clientInfo = request ? getClientInfo(request) : {};

  await createAuditLog({
    userId,
    action,
    resource: 'payment',
    resourceId: paymentId,
    ...clientInfo,
    metadata,
  });
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  action: Extract<AuditAction, 'SECURITY_ALERT' | 'SUSPICIOUS_ACTIVITY'>,
  userId: string | undefined,
  request?: NextRequest,
  metadata?: Record<string, any>
) {
  const clientInfo = request ? getClientInfo(request) : {};

  await createAuditLog({
    userId,
    action,
    resource: 'security',
    ...clientInfo,
    metadata,
  });
}

/**
 * Log privacy event
 */
export async function logPrivacyEvent(
  action: Extract<AuditAction, 'DATA_EXPORTED' | 'ACCOUNT_DELETION_REQUESTED'>,
  userId: string,
  request?: NextRequest,
  metadata?: Record<string, any>
) {
  const clientInfo = request ? getClientInfo(request) : {};

  await createAuditLog({
    userId,
    action,
    resource: 'privacy',
    ...clientInfo,
    metadata,
  });
}
