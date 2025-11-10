import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const customDomainSchema = z.object({
  domain: z
    .string()
    .min(3, 'Domain must be at least 3 characters')
    .regex(
      /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i,
      'Invalid domain format'
    ),
})

export type CustomDomainData = z.infer<typeof customDomainSchema>

export type DomainVerificationStatus = 'pending' | 'verified' | 'failed'

export interface DomainVerificationResult {
  status: DomainVerificationStatus
  verified: boolean
  message: string
  dnsRecords?: {
    type: string
    name: string
    value: string
    verified: boolean
  }[]
}

/**
 * Server-side domain service
 */
export const serverDomainService = {
  /**
   * Configure custom domain for user
   */
  async setCustomDomain(userId: string, domain: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate domain
      customDomainSchema.parse({ domain })

      // Check if domain is already taken
      const existingDomain = await prisma.user.findFirst({
        where: {
          customDomain: domain,
          id: { not: userId },
        },
      })

      if (existingDomain) {
        return { success: false, error: 'Domain is already in use' }
      }

      // Update user's custom domain
      await prisma.user.update({
        where: { id: userId },
        data: { customDomain: domain },
      })

      return { success: true }
    } catch (error) {
      console.error('Error setting custom domain:', error)
      if (error instanceof z.ZodError) {
        return { success: false, error: error.issues[0].message }
      }
      return { success: false, error: 'Failed to set custom domain' }
    }
  },

  /**
   * Remove custom domain from user
   */
  async removeCustomDomain(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { customDomain: null },
      })

      return { success: true }
    } catch (error) {
      console.error('Error removing custom domain:', error)
      return { success: false, error: 'Failed to remove custom domain' }
    }
  },

  /**
   * Verify domain DNS configuration
   */
  async verifyDomain(domain: string): Promise<DomainVerificationResult> {
    try {
      // In a real implementation, this would check DNS records
      // For now, we'll simulate the verification process
      
      const dnsRecords = [
        {
          type: 'CNAME',
          name: domain,
          value: 'scheduler.yourdomain.com',
          verified: false,
        },
        {
          type: 'TXT',
          name: `_verification.${domain}`,
          value: `scheduler-verification=${this.generateVerificationToken(domain)}`,
          verified: false,
        },
      ]

      // Simulate DNS lookup (in production, use dns.promises.resolve)
      // const verified = await this.checkDNSRecords(domain, dnsRecords)

      return {
        status: 'pending',
        verified: false,
        message: 'Domain verification pending. Please configure DNS records.',
        dnsRecords,
      }
    } catch (error) {
      console.error('Error verifying domain:', error)
      return {
        status: 'failed',
        verified: false,
        message: 'Failed to verify domain',
      }
    }
  },

  /**
   * Get DNS configuration instructions for domain
   */
  getDNSInstructions(domain: string): {
    records: Array<{
      type: string
      name: string
      value: string
      description: string
    }>
    instructions: string[]
  } {
    const verificationToken = this.generateVerificationToken(domain)
    
    return {
      records: [
        {
          type: 'CNAME',
          name: domain,
          value: 'scheduler.yourdomain.com',
          description: 'Points your custom domain to our servers',
        },
        {
          type: 'TXT',
          name: `_verification.${domain}`,
          value: `scheduler-verification=${verificationToken}`,
          description: 'Verifies domain ownership',
        },
      ],
      instructions: [
        'Log in to your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare)',
        'Navigate to DNS settings for your domain',
        'Add the CNAME record to point your domain to our servers',
        'Add the TXT record for domain verification',
        'Wait for DNS propagation (can take up to 48 hours)',
        'Return here to verify your domain configuration',
      ],
    }
  },

  /**
   * Generate verification token for domain
   */
  generateVerificationToken(domain: string): string {
    // In production, use a proper token generation method
    const crypto = require('crypto')
    return crypto
      .createHash('sha256')
      .update(`${domain}-${process.env.DOMAIN_VERIFICATION_SECRET || 'secret'}`)
      .digest('hex')
      .substring(0, 32)
  },

  /**
   * Check if domain is available
   */
  async isDomainAvailable(domain: string, excludeUserId?: string): Promise<boolean> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          customDomain: domain,
          ...(excludeUserId && { id: { not: excludeUserId } }),
        },
      })

      return !user
    } catch (error) {
      console.error('Error checking domain availability:', error)
      return false
    }
  },

  /**
   * Get user by custom domain
   */
  async getUserByDomain(domain: string) {
    try {
      return await prisma.user.findFirst({
        where: { customDomain: domain },
      })
    } catch (error) {
      console.error('Error getting user by domain:', error)
      return null
    }
  },
}
