# Customization and Branding Components

This directory contains components for implementing customization and branding features (Task 15).

## Components Overview

### 1. Branding Settings (`branding-settings.tsx`)
Enhanced branding configuration with:
- **Color Picker**: Preset colors and custom color selection
- **Logo Upload**: File upload with validation (max 2MB, image formats)
- **Theme Preview**: Live preview of brand colors on booking page elements
- **Custom Domain**: Placeholder for custom domain configuration

**Features:**
- Tabbed interface for preset vs custom colors
- Real-time preview of branding changes
- File validation and error handling
- Integration with user service for logo upload

### 2. Theme Preview (`theme-preview.tsx`)
Reusable component for previewing booking page themes:
- Shows how brand colors and logo appear on booking pages
- Mock booking interface with time slots and buttons
- Can be used standalone or embedded in other components

### 3. Custom Domain Settings (`custom-domain-settings.tsx`)
Complete custom domain management:
- **Domain Configuration**: Add/remove custom domains
- **DNS Instructions**: Step-by-step setup guide with copyable records
- **Domain Verification**: Check DNS configuration status
- **Verification Status**: Visual indicators for pending/verified/failed states

**Features:**
- CNAME and TXT record configuration
- Copy-to-clipboard functionality
- Real-time verification
- Domain routing information

### 4. Booking Page Customization (`booking-page-customization.tsx`)
Layout and styling customization:
- **Layout Templates**: Default, Centered, Split layouts
- **Custom CSS**: Advanced styling with CSS injection
- **Live Preview**: See changes before saving
- **CSS Variables**: Documentation of available variables

**Features:**
- Visual layout selector with previews
- CSS editor with syntax highlighting
- Safety warnings for custom CSS
- Preview mode with browser chrome

### 5. White-Label Settings (`white-label-settings.tsx`)
Premium white-label options:
- **Platform Branding**: Hide "Powered by" text
- **Custom Header/Footer**: Add custom HTML
- **Email Branding**: Custom branding in emails
- **SEO Customization**: Meta tags and social sharing

**Features:**
- Premium feature gating
- Tabbed interface (Branding, Email, SEO)
- Live previews for all customizations
- HTML sanitization for security

### 6. Customizable Booking Page (`../booking/CustomizableBookingPage.tsx`)
Enhanced booking page with theme support:
- Dynamic layout rendering based on user settings
- Brand color application via CSS variables
- Logo display support
- Custom CSS injection

## API Routes

### Domain Management
- `POST /api/user/domain` - Configure custom domain
- `DELETE /api/user/domain` - Remove custom domain
- `GET /api/user/domain/verify` - Verify domain configuration
- `GET /api/user/domain/instructions` - Get DNS setup instructions

### Customization
- `POST /api/user/booking-customization` - Save layout and CSS settings
- `GET /api/user/booking-customization` - Fetch current settings

### White-Label
- `POST /api/user/white-label` - Save white-label settings (Premium only)
- `GET /api/user/white-label` - Fetch white-label settings

## Services

### Domain Service (`services/domain-service.server.ts`)
Server-side domain management:
- Domain validation and availability checking
- DNS verification (simulated, ready for production implementation)
- Verification token generation
- Domain routing utilities

### User Service
Extended with branding methods:
- `updateBranding()` - Update brand color and logo
- `uploadLogo()` - Handle logo file uploads

## Utilities

### Domain Routing (`lib/domain-routing.ts`)
- Custom domain detection
- User lookup by domain
- Booking URL resolution
- Domain verification helpers

### White-Label (`lib/white-label.ts`)
- Meta tag generation for SEO
- HTML sanitization
- Email template branding
- Platform branding utilities

## Database Schema Changes

New fields added to `User` model:
```prisma
// Booking Page Customization
bookingLayout     String?  @default("default")
customCSS         String?  @db.Text

// White-label Options
isPremium         Boolean  @default(false)
hidePlatformBranding Boolean @default(false)
customFooter      String?  @db.Text
customHeader      String?  @db.Text
emailBrandingEnabled Boolean @default(false)
metaTitle         String?
metaDescription   String?
metaImage         String?
```

## Usage Example

```tsx
import { BrandingSettings } from '@/components/profile/branding-settings'
import { CustomDomainSettings } from '@/components/profile/custom-domain-settings'
import { BookingPageCustomization } from '@/components/profile/booking-page-customization'
import { WhiteLabelSettings } from '@/components/profile/white-label-settings'

// In your settings page
<BrandingSettings
  userId={user.id}
  currentBranding={{
    brandColor: user.brandColor,
    logoUrl: user.logoUrl,
  }}
  onUpdate={handleUpdate}
/>

<CustomDomainSettings
  userId={user.id}
  currentDomain={user.customDomain}
  onUpdate={handleUpdate}
/>

<BookingPageCustomization
  userId={user.id}
  currentSettings={{
    layout: user.bookingLayout,
    customCSS: user.customCSS,
    brandColor: user.brandColor,
    logoUrl: user.logoUrl,
  }}
  userName={user.name}
  onUpdate={handleUpdate}
/>

<WhiteLabelSettings
  userId={user.id}
  currentSettings={{
    isPremium: user.isPremium,
    hidePlatformBranding: user.hidePlatformBranding,
    customFooter: user.customFooter,
    customHeader: user.customHeader,
    emailBrandingEnabled: user.emailBrandingEnabled,
    metaTitle: user.metaTitle,
    metaDescription: user.metaDescription,
    metaImage: user.metaImage,
  }}
  onUpdate={handleUpdate}
/>
```

## Requirements Mapping

- **Requirement 9.1**: Brand color and logo customization ✓
- **Requirement 9.2**: Custom domain support ✓
- **Requirement 9.3**: Theme preview system ✓
- **Requirement 9.4**: White-label options for premium users ✓
- **Requirement 9.5**: SEO customization ✓

## Security Considerations

1. **HTML Sanitization**: Custom header/footer HTML is sanitized to prevent XSS
2. **File Upload**: Logo uploads are validated for size and type
3. **CSS Injection**: Custom CSS should be reviewed; consider using CSS-in-JS for better security
4. **Domain Verification**: Implements token-based verification to prevent domain hijacking
5. **Premium Features**: White-label features are gated behind premium status check

## Future Enhancements

1. **DNS Verification**: Implement actual DNS record checking using Node.js dns module
2. **CSS Sanitization**: Add CSS parser to validate and sanitize custom CSS
3. **Template Library**: Pre-built layout templates and themes
4. **A/B Testing**: Test different layouts and colors for conversion optimization
5. **Advanced Analytics**: Track which customizations lead to more bookings
