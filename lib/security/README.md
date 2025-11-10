# Security Implementation

This directory contains all security-related utilities and features for the Calendly Scheduler application.

## Features

### 1. Rate Limiting (`rate-limit.ts`)

Protects against abuse and DDoS attacks by limiting the number of requests from a single client.

**Usage:**
```typescript
import { withRateLimit, rateLimitConfigs } from '@/lib/security/rate-limit';

export const POST = withRateLimit(
  async (request) => {
    // Your handler logic
  },
  rateLimitConfigs.auth // Use appropriate config
);
```

**Configurations:**
- `public`: 30 requests per minute (for booking pages)
- `auth`: 5 requests per 15 minutes (for authentication)
- `api`: 60 requests per minute (for general API)
- `booking`: 10 requests per minute (for booking creation)

### 2. CSRF Protection (`csrf.ts`)

Prevents Cross-Site Request Forgery attacks on state-changing operations.

**Server-side:**
```typescript
import { requireCsrfToken } from '@/lib/security/csrf';

export async function POST(request: NextRequest) {
  const isValid = await requireCsrfToken(request);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }
  // Process request
}
```

**Client-side:**
```typescript
const response = await fetch('/api/csrf');
const { token } = await response.json();

// Include token in requests
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token,
  },
});
```

### 3. Input Sanitization (`sanitize.ts`)

Prevents XSS and injection attacks by sanitizing user input.

**Functions:**
- `sanitizeHtml(input)`: Escape HTML special characters
- `sanitizeEmail(email)`: Normalize email addresses
- `sanitizePhone(phone)`: Clean phone numbers
- `sanitizeUrl(url)`: Prevent dangerous URL protocols
- `sanitizeFilename(filename)`: Prevent path traversal
- `sanitizeUsername(username)`: Validate usernames
- `sanitizeSlug(slug)`: Create safe URL slugs
- `sanitizeObject(obj)`: Recursively sanitize objects

**Usage:**
```typescript
import { sanitizeHtml, sanitizeEmail } from '@/lib/security/sanitize';

const safeName = sanitizeHtml(userInput.name);
const safeEmail = sanitizeEmail(userInput.email);
```

### 4. Security Headers (`headers.ts`)

Applies security headers to all responses to protect against common web vulnerabilities.

**Headers Applied:**
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-XSS-Protection`: Enables XSS protection
- `Content-Security-Policy`: Controls resource loading
- `Strict-Transport-Security`: Enforces HTTPS
- `Referrer-Policy`: Controls referrer information
- `Permissions-Policy`: Controls browser features

Headers are automatically applied via middleware.

### 5. Two-Factor Authentication (`two-factor.ts`)

Implements TOTP-based 2FA for enhanced account security.

**Service Functions:**
```typescript
import { initializeTwoFactor, enableTwoFactor, verifyTwoFactorCode } from '@/services/two-factor-service';

// Setup 2FA
const { secret, qrCodeUrl, backupCodes } = await initializeTwoFactor(userId, email);

// Enable after verification
await enableTwoFactor(userId, secret, code, backupCodes);

// Verify code during login
const isValid = await verifyTwoFactorCode(userId, code);
```

**Components:**
- `TwoFactorSetup`: Setup wizard with QR code
- `TwoFactorVerification`: Login verification form

### 6. Audit Logging (`audit-helpers.ts`)

Tracks security-sensitive operations for compliance and security monitoring.

**Helper Functions:**
```typescript
import { logAuthEvent, logBookingEvent, logSecurityEvent } from '@/lib/security/audit-helpers';

// Log authentication
await logAuthEvent('LOGIN_SUCCESS', userId, request);

// Log booking
await logBookingEvent('BOOKING_CREATED', userId, bookingId, request);

// Log security event
await logSecurityEvent('SUSPICIOUS_ACTIVITY', userId, request, {
  reason: 'Multiple failed attempts',
});
```

**Audit Actions:**
- Authentication: LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, PASSWORD_RESET, etc.
- User Management: USER_CREATED, USER_UPDATED, USER_DELETED
- Bookings: BOOKING_CREATED, BOOKING_UPDATED, BOOKING_CANCELLED
- Payments: PAYMENT_PROCESSED, PAYMENT_REFUNDED
- Security: SECURITY_ALERT, SUSPICIOUS_ACTIVITY
- Privacy: DATA_EXPORTED, ACCOUNT_DELETION_REQUESTED

### 7. API Security Helpers (`api-helpers.ts`)

Wrapper functions for securing API routes.

**Usage:**
```typescript
import { withSecurity } from '@/lib/security/api-helpers';

export const POST = withSecurity(
  async (request) => {
    // Your handler logic
  },
  {
    requireCsrf: true,
    sanitizeInput: true,
  }
);
```

## Environment Variables

Required environment variables for security features:

```env
# Encryption key for 2FA secrets (32+ characters)
ENCRYPTION_KEY=your-secure-encryption-key-here

# Allowed origins for CORS (comma-separated)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Database Schema

The security implementation requires these Prisma models:

```prisma
model User {
  // ... other fields
  twoFactorEnabled  Boolean   @default(false)
  twoFactorSecret   String?   // Encrypted TOTP secret
  backupCodes       Json?     // Array of hashed backup codes
  auditLogs         AuditLog[]
}

model AuditLog {
  id          String      @id @default(cuid())
  userId      String?
  action      AuditAction
  resource    String
  resourceId  String?
  ipAddress   String?
  userAgent   String?
  metadata    Json?
  createdAt   DateTime    @default(now())
}
```

## Best Practices

1. **Always validate input**: Use Zod schemas + sanitization
2. **Log security events**: Use audit helpers for sensitive operations
3. **Rate limit endpoints**: Apply appropriate rate limits
4. **Use CSRF protection**: For all state-changing operations
5. **Enable 2FA**: Encourage users to enable 2FA
6. **Monitor audit logs**: Regularly review for suspicious activity
7. **Keep secrets secure**: Never commit secrets to version control
8. **Update dependencies**: Regularly update security-related packages

## Testing

Security features should be tested thoroughly:

```typescript
// Test rate limiting
test('should block after rate limit exceeded', async () => {
  // Make multiple requests
  // Verify 429 response
});

// Test CSRF protection
test('should reject requests without CSRF token', async () => {
  // Make POST without token
  // Verify 403 response
});

// Test 2FA
test('should verify valid TOTP code', async () => {
  // Generate code
  // Verify code
  // Assert success
});
```

## Monitoring

Set up monitoring for:
- Failed login attempts
- Rate limit violations
- CSRF token failures
- Suspicious activity patterns
- 2FA setup/disable events

## Compliance

This implementation helps meet requirements for:
- **GDPR**: Data export, deletion, consent management
- **SOC 2**: Audit logging, access controls
- **PCI DSS**: Secure authentication, logging (if handling payments)

## Support

For security issues or questions:
1. Review this documentation
2. Check audit logs for suspicious activity
3. Contact security team for incidents
