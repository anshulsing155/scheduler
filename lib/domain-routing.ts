import { serverDomainService } from '@/services/domain-service.server'

/**
 * Domain routing utilities
 */

/**
 * Check if request is from a custom domain
 */
export function isCustomDomain(host: string): boolean {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000'
  return host !== appDomain && !host.startsWith('www.')
}

/**
 * Extract custom domain from request
 */
export function extractCustomDomain(host: string): string | null {
  if (!isCustomDomain(host)) {
    return null
  }
  
  // Remove port if present
  return host.split(':')[0]
}

/**
 * Get user by custom domain
 */
export async function getUserByCustomDomain(domain: string) {
  return await serverDomainService.getUserByDomain(domain)
}

/**
 * Resolve booking page URL for custom domain
 */
export function resolveBookingUrl(username: string, eventSlug: string, customDomain?: string): string {
  if (customDomain) {
    return `https://${customDomain}/${eventSlug}`
  }
  
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  return `${protocol}://${appDomain}/${username}/${eventSlug}`
}

/**
 * Check if domain is verified
 * In production, this would check actual DNS records
 */
export async function isDomainVerified(domain: string): Promise<boolean> {
  const result = await serverDomainService.verifyDomain(domain)
  return result.verified
}
