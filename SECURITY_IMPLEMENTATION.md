# Security and Privacy Features Implementation

This document describes the security and privacy features implemented for Task 16.

## Overview

Task 16 implements comprehensive security and privacy features including:
1. Security infrastructure (rate limiting, CSRF protection, input sanitization, security headers)
2. Two-factor authentication (2FA)
3. Privacy compliance features (GDPR data export, account deletion, consent management)
4. Audit logging for security monitoring

## Database Schema Changes

The following changes were made to the Prisma schema:

### User Model Updates
```prisma
model User {
  // ... existing fields
  
  // Two-Factor Authentication
  twoFactorEnabled  Boolean   @default(false)
  twoFactorSecret   String?   // Encrypted TOTP secret
  backupCodes       Json?     // Array of hashed backup codes
  
  // Relations
  auditLogs         AuditLog[]
}
```

### New AuditLog Model
```prisma
model AuditLog {
  id          String      @id @default(cuid())
  userId      String?
  user        User?       @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  action      AuditAction
  resource    String
  resourceId  String?
  
  ipAddress   String?
  userAgent   String?     @db.Text
  
  metadata    Json?
  
  createdAt   DateTime    @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([resource])
  @@index([createdAt])
}

enum AuditAction {
  // Authentication
  LOGIN_SUCCESS
  LOGIN_FAILED
  LOGOUT
  PASSWORD_RESET
  PASSWORD_CHANGED
  TWO_FACTOR_ENABLED
  TWO_FACTOR_DISABLED
  
  // User Management
  USER_CREATED
  USER_UPDATED
  USER_DELETED
  
  // Bookings
  BOOKING_CREATED
  BOOKING_UPDATED
  BOOKING_CANCELLED
  BOOKING_RESCHEDULED
  
  // Event Types
  EVENT_TYPE_CREATED
  EVENT_TYPE_UPDATED
  EVENT_TYPE_DELETED
  
  // Payments
  PAYMENT_PROCESSED
  PAYMENT_REFUNDED
  
  // Security
  SECURITY_ALERT
  SUSPICIOUS_ACTIVITY
  
  // Privacy
  DATA_EXPORTED
  ACCOUNT_DELETION_REQUESTED
}
```

## Migration Steps

To apply these schema changes to your database:

```bash
# Generate Prisma client with new types
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_security_features

# Or for production
npx prisma migrate deploy
```

## Environment Variables

Add these required environment variables to your `.env` file:

```env
# Encryption key for 2FA secrets (generate a secure random string)
ENCRYPTION_KEY=your-secure-32-character-encryption-key-here

# Allowed origins for CORS (comma-separated)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

To generate a secure encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Implementation Details

### 1. Security Infrastructure (Subtask 16.1)

**Files Created:**
- `lib/security/rate-limit.ts` - Rate limiting middleware
- `lib/security/csrf.ts` - CSRF token generation and validation
- `lib/security/sanitize.ts` - Input sanitization utilities
- `lib/security/headers.ts` - Security headers configuration
- `lib/security/api-helpers.ts` - API route security wrappers
- `lib/security/index.ts` - Centralized exports
- `app/api/csrf/route.ts` - CSRF token endpoint
- `middleware.ts` - Updated with security features

**Features:**
- Rate limiting with configurable limits per endpoint type
- CSRF protection for state-changing operations
- Comprehensive input sanitization functions
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- API route security wrappers

### 2. Two-Factor Authentication (Subtask 16.2)

**Files Created:**
- `lib/security/two-factor.ts` - TOTP implementation
- `services/two-factor-service.ts` - 2FA business logic
- `components/auth/TwoFactorSetup.tsx` - Setup wizard UI
- `components/auth/TwoFactorVerification.tsx` - Verification UI
- `app/api/auth/2fa/setup/route.ts` - Initialize 2FA
- `app/api/auth/2fa/enable/route.ts` - Enable 2FA
- `app/api/auth/2fa/disable/route.ts` - Disable 2FA
- `app/api/auth/2fa/verify/route.ts` - Verify 2FA code
- `app/api/auth/2fa/backup-codes/route.ts` - Manage backup codes

**Features:**
- TOTP-based authentication (compatible with Google Authenticator, Authy, etc.)
- QR code generation for easy setup
- Backup codes for account recovery
- Encrypted storage of 2FA secrets
- Support for both TOTP codes and backup codes

### 3. Privacy Compliance (Subtask 16.3)

**Files Created:**
- `services/privacy-service.ts` - Privacy operations
- `components/profile/PrivacySettings.tsx` - Privacy UI
- `app/api/privacy/export/route.ts` - Data export endpoint
- `app/api/privacy/delete/route.ts` - Account deletion endpoint
- `app/api/privacy/consent/route.ts` - Consent management endpoint

**Features:**
- GDPR-compliant data export (JSON format)
- Account deletion with 30-day grace period
- Consent management for marketing and analytics
- Data retention policy information
- Anonymization option (alternative to deletion)

### 4. Audit Logging (Subtask 16.4)

**Files Created:**
- `services/audit-service.ts` - Audit logging service
- `lib/security/audit-helpers.ts` - Logging helper functions
- `components/profile/SecuritySettings.tsx` - Security UI with audit logs
- `app/api/audit/logs/route.ts` - Audit logs endpoint
- `app/api/audit/security/route.ts` - Security events endpoint
- `lib/security/README.md` - Comprehensive documentation

**Features:**
- Comprehensive audit logging for all sensitive operations
- Login history tracking
- Security event monitoring
- Suspicious activity detection
- Audit log statistics and reporting
- Automatic cleanup of old logs (90-day retention)

## Usage Examples

### Rate Limiting
```typescript
import { withRateLimit, rateLimitConfigs } from '@/lib/security/rate-limit';

export const POST = withRateLimit(
  async (request) => {
    // Your handler
  },
  rateLimitConfigs.auth
);
```

### CSRF Protection
```typescript
// Client-side
const response = await fetch('/api/csrf');
const { token } = await response.json();

fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'X-CSRF-Token': token },
});
```

### Input Sanitization
```typescript
import { sanitizeHtml, sanitizeEmail } from '@/lib/security/sanitize';

const safeName = sanitizeHtml(userInput.name);
const safeEmail = sanitizeEmail(userInput.email);
```

### Two-Factor Authentication
```typescript
// Setup
const { secret, qrCodeUrl, backupCodes } = await initializeTwoFactor(userId, email);

// Enable
await enableTwoFactor(userId, secret, code, backupCodes);

// Verify
const isValid = await verifyTwoFactorCode(userId, code);
```

### Audit Logging
```typescript
import { logAuthEvent, logBookingEvent } from '@/lib/security/audit-helpers';

await logAuthEvent('LOGIN_SUCCESS', userId, request);
await logBookingEvent('BOOKING_CREATED', userId, bookingId, request);
```

## Testing

The implementation includes comprehensive security features that should be tested:

1. **Rate Limiting**: Test that requests are blocked after exceeding limits
2. **CSRF Protection**: Verify requests without tokens are rejected
3. **2FA**: Test TOTP code generation and verification
4. **Data Export**: Verify all user data is included
5. **Audit Logging**: Confirm events are logged correctly

## Security Best Practices

1. Always use HTTPS in production
2. Regularly rotate the ENCRYPTION_KEY
3. Monitor audit logs for suspicious activity
4. Keep dependencies updated
5. Review security headers configuration
6. Test rate limits under load
7. Encourage users to enable 2FA
8. Regularly backup audit logs

## Compliance

This implementation helps meet requirements for:
- **GDPR**: Data export, deletion, consent management
- **SOC 2**: Audit logging, access controls, security monitoring
- **PCI DSS**: Secure authentication, logging (if handling payments)

## Next Steps

1. Run database migrations to apply schema changes
2. Set up environment variables
3. Test all security features
4. Configure monitoring and alerting
5. Update user documentation
6. Train support team on security features

## Support

For detailed documentation, see:
- `lib/security/README.md` - Comprehensive security documentation
- Individual file comments for specific implementations
