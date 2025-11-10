# Authentication Components

This directory contains all authentication-related UI components for the Calendly Scheduler application.

## Components

### LoginForm
- Email/password authentication
- OAuth login with Google and Microsoft
- Form validation using Zod
- Error handling and loading states
- Links to registration and password reset

**Usage:**
```tsx
import { LoginForm } from '@/components/auth'

export default function LoginPage() {
  return <LoginForm />
}
```

### RegisterForm
- User registration with email/password
- OAuth signup with Google and Microsoft
- Email verification flow
- Username validation (lowercase, numbers, hyphens only)
- Password confirmation
- Success state showing email verification message

**Usage:**
```tsx
import { RegisterForm } from '@/components/auth'

export default function RegisterPage() {
  return <RegisterForm />
}
```

### PasswordResetForm
- Password reset request via email
- Email validation
- Success state with instructions
- Link back to login

**Usage:**
```tsx
import { PasswordResetForm } from '@/components/auth'

export default function ForgotPasswordPage() {
  return <PasswordResetForm />
}
```

### UpdatePasswordForm
- Password update after reset
- Password confirmation
- Redirects to dashboard on success

**Usage:**
```tsx
import { UpdatePasswordForm } from '@/components/auth'

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />
}
```

### AuthProvider
- React Context provider for authentication state
- Manages user session
- Listens for auth state changes
- Provides `useAuth` hook for accessing auth state

**Usage:**
```tsx
// In app/layout.tsx
import { AuthProvider } from '@/components/auth'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

// In any component
import { useAuth } from '@/components/auth'

function MyComponent() {
  const { user, loading, signOut } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>
  
  return (
    <div>
      <p>Welcome {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

## Features

### Email/Password Authentication
- Secure password validation (minimum 6 characters)
- Email format validation
- Password confirmation on registration

### OAuth Integration
- Google OAuth
- Microsoft OAuth (Azure)
- Automatic redirect handling

### Email Verification
- Verification email sent on registration
- Callback URL handling
- Success messages

### Password Reset
- Reset link sent via email
- Secure token-based reset
- Password update flow

### State Management
- Global auth state via Context API
- Real-time auth state updates
- Loading states
- Error handling

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 1.1**: Email and OAuth authentication (Google, Microsoft)
- **Requirement 1.5**: Secure password reset functionality via email verification

## Technical Details

- Built with React 18 and Next.js 14 App Router
- Uses Supabase Auth for authentication
- Form validation with Zod and react-hook-form
- UI components from shadcn/ui
- TypeScript for type safety
- Client-side components with 'use client' directive
