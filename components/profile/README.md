# Profile Components

This directory contains components for user profile management.

## Components

### AvatarUpload
Handles profile photo upload with preview and validation.

**Features:**
- Image preview before upload
- File type validation (images only)
- File size validation (max 5MB)
- Upload to Supabase Storage
- Fallback to initials when no avatar

**Usage:**
```tsx
<AvatarUpload
  currentAvatarUrl={profile.avatarUrl}
  onUpload={handleAvatarUpload}
  userName={profile.name || profile.username}
/>
```

### TimezoneSelector
Searchable timezone selector with grouped options.

**Features:**
- Search functionality
- Grouped by region (North America, Europe, Asia, etc.)
- 50+ common timezones
- Current selection display

**Usage:**
```tsx
<TimezoneSelector
  value={formData.timezone}
  onChange={handleTimezoneChange}
/>
```

### BrandingSettings
Manage brand colors and logo for booking pages.

**Features:**
- Color picker with hex input
- Logo upload to Supabase Storage
- Live preview of brand colors
- Logo removal
- Custom domain placeholder (coming soon)

**Usage:**
```tsx
<BrandingSettings
  userId={profile.id}
  currentBranding={{
    brandColor: profile.brandColor,
    logoUrl: profile.logoUrl,
  }}
  onUpdate={loadProfile}
/>
```

## Pages

### Profile Settings Page
Location: `app/dashboard/settings/profile/page.tsx`

Complete profile management interface with:
- Avatar upload
- Basic information (name, bio, email, username)
- Timezone selection
- Week start preference
- Time format (12h/24h)
- Date format
- Branding settings (colors and logo)

## API Routes

All profile-related API routes are in `app/api/users/`:
- `GET /api/users/me` - Get current user profile
- `GET /api/users/[userId]` - Get user profile by ID
- `PATCH /api/users/[userId]` - Update user profile
- `PATCH /api/users/[userId]/branding` - Update branding settings
- `PATCH /api/users/[userId]/avatar` - Update avatar URL
- `DELETE /api/users/[userId]/avatar` - Remove avatar
- `PATCH /api/users/[userId]/username` - Update username
- `POST /api/users/check-username` - Check username availability

## Services

### userService (Client-side)
Client-side service for profile operations with validation.

### serverUserService (Server-side)
Server-side service for database operations via Prisma.

## Validation

All profile updates are validated using Zod schemas:
- `updateProfileSchema` - Name, bio, timezone, preferences
- `updateBrandingSchema` - Brand color, logo URL, custom domain
- `updateUsernameSchema` - Username format and uniqueness

## Storage

Profile images are stored in Supabase Storage:
- Bucket: `user-uploads`
- Avatars: `avatars/[userId]-[timestamp].[ext]`
- Logos: `logos/[userId]-logo-[timestamp].[ext]`
