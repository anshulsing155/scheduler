'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CustomDomainSettingsProps {
  userId: string
  currentDomain: string | null
  onUpdate: () => void
}

interface DNSRecord {
  type: string
  name: string
  value: string
  description: string
}

export function CustomDomainSettings({ userId, currentDomain, onUpdate }: CustomDomainSettingsProps) {
  const [domain, setDomain] = useState(currentDomain || '')
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed' | null>(
    currentDomain ? 'pending' : null
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([])

  const handleSaveDomain = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/user/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim().toLowerCase() }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Domain configured successfully')
        setVerificationStatus('pending')
        setShowInstructions(true)
        await fetchDNSInstructions()
        onUpdate()
      } else {
        setError(result.error || 'Failed to configure domain')
      }
    } catch (err) {
      setError('Failed to configure domain')
    }

    setSaving(false)
  }

  const handleRemoveDomain = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/user/domain', {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setDomain('')
        setVerificationStatus(null)
        setShowInstructions(false)
        setSuccess('Domain removed successfully')
        onUpdate()
      } else {
        setError(result.error || 'Failed to remove domain')
      }
    } catch (err) {
      setError('Failed to remove domain')
    }

    setSaving(false)
  }

  const handleVerifyDomain = async () => {
    setVerifying(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/user/domain/verify?domain=${encodeURIComponent(domain)}`)
      const result = await response.json()

      if (result.verified) {
        setVerificationStatus('verified')
        setSuccess('Domain verified successfully!')
      } else {
        setVerificationStatus('failed')
        setError(result.message || 'Domain verification failed. Please check your DNS records.')
      }
    } catch (err) {
      setError('Failed to verify domain')
    }

    setVerifying(false)
  }

  const fetchDNSInstructions = async () => {
    try {
      const response = await fetch(`/api/user/domain/instructions?domain=${encodeURIComponent(domain)}`)
      const result = await response.json()

      if (result.records) {
        setDnsRecords(result.records)
      }
    } catch (err) {
      console.error('Failed to fetch DNS instructions:', err)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copied to clipboard!')
    setTimeout(() => setSuccess(null), 2000)
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Custom Domain</h2>
      <p className="text-gray-600 mb-6">
        Use your own domain for booking pages (e.g., booking.yourdomain.com)
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Domain Input */}
        <div>
          <Label htmlFor="customDomain">Domain</Label>
          <div className="flex gap-3 mt-2">
            <Input
              id="customDomain"
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="booking.yourdomain.com"
              disabled={saving || !!currentDomain}
              className="flex-1"
            />
            {currentDomain ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemoveDomain}
                disabled={saving}
              >
                Remove
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSaveDomain}
                disabled={saving || !domain.trim()}
              >
                {saving ? 'Saving...' : 'Configure'}
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Enter the subdomain you want to use (e.g., booking.yourdomain.com)
          </p>
        </div>

        {/* Verification Status */}
        {verificationStatus && (
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Verification Status:</span>
                <Badge
                  variant={
                    verificationStatus === 'verified'
                      ? 'default'
                      : verificationStatus === 'failed'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {verificationStatus === 'verified'
                    ? 'Verified'
                    : verificationStatus === 'failed'
                    ? 'Failed'
                    : 'Pending'}
                </Badge>
              </div>
              {verificationStatus !== 'verified' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyDomain}
                  disabled={verifying}
                >
                  {verifying ? 'Verifying...' : 'Verify Now'}
                </Button>
              )}
            </div>
            
            {verificationStatus === 'verified' && (
              <p className="text-sm text-green-600">
                Your domain is verified and active. Visitors can now access your booking pages at {domain}
              </p>
            )}
            
            {verificationStatus === 'pending' && (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Configure your DNS records to verify domain ownership.
                </p>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setShowInstructions(!showInstructions)
                    if (!showInstructions && dnsRecords.length === 0) {
                      fetchDNSInstructions()
                    }
                  }}
                  className="p-0 h-auto"
                >
                  {showInstructions ? 'Hide' : 'Show'} DNS Configuration
                </Button>
              </div>
            )}
          </div>
        )}

        {/* DNS Configuration Instructions */}
        {showInstructions && (
          <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg space-y-4">
            <h3 className="font-semibold text-blue-900">DNS Configuration</h3>
            
            <div className="space-y-3">
              <p className="text-sm text-blue-800">
                Add the following DNS records to your domain registrar:
              </p>
              
              {dnsRecords.map((record, index) => (
                <div key={index} className="bg-white p-3 rounded border border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded">
                        {record.type}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">{record.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Name:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{record.name}</code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(record.name)}
                          className="h-6 px-2"
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Value:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs max-w-xs truncate">
                          {record.value}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(record.value)}
                          className="h-6 px-2"
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Log in to your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare)</li>
                <li>Navigate to DNS settings for your domain</li>
                <li>Add the CNAME and TXT records shown above</li>
                <li>Wait for DNS propagation (can take up to 48 hours)</li>
                <li>Click "Verify Now" to check your configuration</li>
              </ol>
            </div>
          </div>
        )}

        {/* Domain Routing Info */}
        {verificationStatus === 'verified' && (
          <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Domain Active</h3>
            <p className="text-sm text-green-800">
              Your booking pages are now accessible at:
            </p>
            <a
              href={`https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-green-700 hover:underline mt-1 block"
            >
              https://{domain}
            </a>
          </div>
        )}
      </div>
    </Card>
  )
}
