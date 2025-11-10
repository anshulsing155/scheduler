/**
 * White-label utilities for customizing booking pages
 */

export interface WhiteLabelSettings {
  hidePlatformBranding: boolean
  customFooter: string | null
  customHeader: string | null
  emailBrandingEnabled: boolean
  metaTitle: string | null
  metaDescription: string | null
  metaImage: string | null
}

/**
 * Generate meta tags for booking page SEO
 */
export function generateMetaTags(
  settings: WhiteLabelSettings,
  defaults: {
    title: string
    description: string
    image?: string
    url: string
  }
) {
  return {
    title: settings.metaTitle || defaults.title,
    description: settings.metaDescription || defaults.description,
    openGraph: {
      title: settings.metaTitle || defaults.title,
      description: settings.metaDescription || defaults.description,
      images: settings.metaImage ? [{ url: settings.metaImage }] : defaults.image ? [{ url: defaults.image }] : [],
      url: defaults.url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.metaTitle || defaults.title,
      description: settings.metaDescription || defaults.description,
      images: settings.metaImage ? [settings.metaImage] : defaults.image ? [defaults.image] : [],
    },
  }
}

/**
 * Sanitize HTML for custom header/footer
 * In production, use a proper HTML sanitizer like DOMPurify
 */
export function sanitizeHTML(html: string): string {
  // Basic sanitization - remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
}

/**
 * Check if user has premium features enabled
 */
export function hasPremiumAccess(isPremium: boolean): boolean {
  return isPremium
}

/**
 * Get platform branding text
 */
export function getPlatformBranding(hideBranding: boolean): string | null {
  if (hideBranding) {
    return null
  }
  return 'Powered by Scheduler'
}

/**
 * Apply white-label settings to email template
 */
export function applyEmailBranding(
  template: string,
  settings: WhiteLabelSettings,
  branding: {
    logoUrl: string | null
    brandColor: string | null
  }
): string {
  let customizedTemplate = template

  // Replace logo
  if (settings.emailBrandingEnabled && branding.logoUrl) {
    customizedTemplate = customizedTemplate.replace(
      '{{LOGO_URL}}',
      branding.logoUrl
    )
  }

  // Replace brand color
  if (settings.emailBrandingEnabled && branding.brandColor) {
    customizedTemplate = customizedTemplate.replace(
      /{{BRAND_COLOR}}/g,
      branding.brandColor
    )
  }

  // Replace footer
  if (settings.customFooter) {
    customizedTemplate = customizedTemplate.replace(
      '{{FOOTER}}',
      sanitizeHTML(settings.customFooter)
    )
  }

  // Remove platform branding if hidden
  if (settings.hidePlatformBranding) {
    customizedTemplate = customizedTemplate.replace(
      /{{PLATFORM_BRANDING}}/g,
      ''
    )
  } else {
    customizedTemplate = customizedTemplate.replace(
      /{{PLATFORM_BRANDING}}/g,
      getPlatformBranding(false) || ''
    )
  }

  return customizedTemplate
}
