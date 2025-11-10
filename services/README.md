# Services Layer

This directory contains the business logic services for the application.

## Authentication Service (`auth-service.ts`)

The authentication service provides comprehensive authentication functionality including email/password auth, OAuth, password reset, and email verification.

### Client-Side Service (`authService`)

Used in client components and pages for authentication operations.

#### Sign Up

```typescript
import { authService } from '@/services/auth-service'

const result = await authService.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  name: 'John Doe',
  username: 'johndoe'
})

if (result.success) {
  if (result.data.needsEmailVerification) {
    // Show message to check email
  } else {
    // User is signed in
  }
} else {
  // Handle error: result.error
}
```

#### Sign In

```typescript
const result = await authService.signIn({
  email: 'user@example.com',
  password: 'securePassword123'
})

if (result.success) {
  // User is signed in
  const { user, session } = result.data
} else {
  // Handle error: result.error
}
```

#### OAuth Sign In

```typescript
const result = await authService.signInWithOAuth('google', '/dashboard')

if (result.success) {
  // Redirect to OAuth provider
  window.location.href = result.data.url
} else {
  // Handle error: result.error
}
```

#### Sign Out

```typescript
const result = await authService.signOut()

if (result.success) {
  // Redirect to login page
} else {
  // Handle error: result.error
}
```

#### Password Reset

```typescript
// Request password reset
const result = await authService.resetPasswordForEmail('user@example.com')

if (result.success) {
  // Show message to check email
}

// Update password (after clicking reset link)
const updateResult = await authService.updatePassword('newPassword123')

if (updateResult.success) {
  // Password updated successfully
}
```

#### Email Verification

```typescript
// Verify email with token
const result = await authService.verifyEmail(token, 'signup')

if (result.success) {
  // Email verified
}

// Resend verification email
const resendResult = await authService.resendVerificationEmail('user@example.com')

if (resendResult.success) {
  // Verification email sent
}
```

#### Get Current User/Session

```typescript
// Get current user
const userResult = await authService.getUser()

if (userResult.success) {
  const user = userResult.data
}

// Get current session
const sessionResult = await authService.getSession()

if (sessionResult.success) {
  const session = sessionResult.data
}

// Refresh session
const refreshResult = await authService.refreshSession()
```

### Server-Side Service (`serverAuthService`)

Used in server components, API routes, and server actions.

#### Get Current User

```typescript
import { serverAuthService } from '@/services/auth-service'

const user = await serverAuthService.getUser()

if (user) {
  // User is authenticated
}
```

#### Require Authentication

```typescript
try {
  const user = await serverAuthService.requireAuth()
  // User is authenticated, proceed
} catch (error) {
  // User is not authenticated, redirect to login
}
```

#### Get User with Profile

```typescript
const userWithProfile = await serverAuthService.getUserWithProfile()

if (userWithProfile) {
  const { profile } = userWithProfile
  // Access user profile data from database
}
```

#### Handle OAuth Callback

```typescript
const result = await serverAuthService.handleOAuthCallback(code)

if (result.success) {
  const { user, redirectUrl } = result.data
  // Redirect user to dashboard
}
```

#### Sync User Profile

```typescript
await serverAuthService.syncUserProfile(
  supabaseUserId,
  email,
  metadata
)
```

#### Check Email Verification

```typescript
const isVerified = await serverAuthService.isEmailVerified()

if (!isVerified) {
  // Prompt user to verify email
}
```

## API Routes

### Check Username Availability

**Endpoint:** `POST /api/auth/check-username`

```typescript
const response = await fetch('/api/auth/check-username', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'johndoe' })
})

const data = await response.json()

if (data.available) {
  // Username is available
} else {
  // Username is taken
}
```

### Verify Email

**Endpoint:** `GET /api/auth/verify-email?token=xxx&type=signup`

Used automatically when user clicks verification link in email.

**Endpoint:** `POST /api/auth/verify-email`

Resend verification email:

```typescript
const response = await fetch('/api/auth/verify-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
})
```

## OAuth Callback Route

**Endpoint:** `GET /auth/callback?code=xxx&next=/dashboard`

Handles OAuth callbacks from Google and Microsoft. Automatically:
1. Exchanges authorization code for session
2. Syncs user profile to database
3. Redirects to specified page

## Error Handling

All service methods return an `AuthResult` type:

```typescript
type AuthResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}
```

Always check the `success` field before accessing `data`:

```typescript
const result = await authService.signIn(credentials)

if (result.success) {
  // Access result.data
} else {
  // Display result.error to user
}
```

## Security Features

- **Password Requirements**: Enforced by Supabase (minimum 6 characters)
- **Email Verification**: Optional but recommended for production
- **OAuth Security**: Uses PKCE flow for enhanced security
- **Session Management**: Automatic session refresh
- **CSRF Protection**: Built into Supabase Auth
- **Rate Limiting**: Should be implemented at API Gateway level

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## OAuth Provider Setup

### Google OAuth

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Configure in Supabase Dashboard under Authentication > Providers

### Microsoft OAuth (Azure)

1. Go to Azure Portal
2. Register application
3. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Configure in Supabase Dashboard under Authentication > Providers

## Best Practices

1. **Always use server-side auth for protected routes**: Use `serverAuthService` in server components
2. **Handle errors gracefully**: Display user-friendly error messages
3. **Verify email addresses**: Enable email verification in production
4. **Use HTTPS**: Always use HTTPS in production
5. **Implement rate limiting**: Protect against brute force attacks
6. **Log security events**: Monitor authentication failures
7. **Keep sessions fresh**: Use `refreshSession()` for long-lived sessions
