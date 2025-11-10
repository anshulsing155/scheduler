# Database Migration Instructions

## Task 15: Customization and Branding

The following fields have been added to the `User` model in `prisma/schema.prisma`:

### Booking Page Customization Fields
- `bookingLayout` (String?, default: "default") - Layout template for booking pages
- `customCSS` (String?, Text) - Custom CSS for booking pages

### White-Label Fields
- `isPremium` (Boolean, default: false) - Premium user status
- `hidePlatformBranding` (Boolean, default: false) - Hide "Powered by" branding
- `customFooter` (String?, Text) - Custom footer HTML
- `customHeader` (String?, Text) - Custom header HTML
- `emailBrandingEnabled` (Boolean, default: false) - Use custom branding in emails
- `metaTitle` (String?) - Custom SEO title
- `metaDescription` (String?) - Custom SEO description
- `metaImage` (String?) - Custom social share image URL

## Migration Steps

1. Run Prisma migration to update the database schema:
   ```bash
   npx prisma migrate dev --name add_customization_fields
   ```

2. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

3. Restart the development server to pick up the new types

## Notes

- The TypeScript errors in the API routes will be resolved once the Prisma client is regenerated
- All new fields are optional or have default values, so existing users won't be affected
- Premium features (white-label options) require `isPremium` to be true
