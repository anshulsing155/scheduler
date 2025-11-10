'use client'

import { useState } from 'react'
import { userService } from '@/services/user-service.client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

interface BrandingSettingsProps {
  userId: string
  currentBranding: {
    brandColor: string | null
    logoUrl: string | null
  }
  onUpdate: () => void
}

export function BrandingSettings({ userId, currentBranding, onUpdate }: BrandingSettingsProps) {
  const [brandColor, setBrandColor] = useState(currentBranding.brandColor || '#3B82F6')
  const [logoUrl, setLogoUrl] = useState(currentBranding.logoUrl || '')
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrandColor(e.target.value)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setError(null)
    setSuccess(null)

    const result = await userService.uploadLogo(userId, file)

    if (result.success && result.data) {
      setLogoUrl(result.data.logoUrl)
      setSuccess('Logo uploaded successfully')
      onUpdate()
    } else {
      setError(result.error || 'Failed to upload logo')
    }

    setUploadingLogo(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    const result = await userService.updateBranding(userId, {
      brandColor,
      logoUrl: logoUrl || undefined,
    })

    if (result.success) {
      setSuccess('Branding updated successfully')
      onUpdate()
    } else {
      setError(result.error || 'Failed to update branding')
    }

    setSaving(false)
  }

  const handleRemoveLogo = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    const result = await userService.updateBranding(userId, {
      logoUrl: undefined,
    })

    if (result.success) {
      setLogoUrl('')
      setSuccess('Logo removed successfully')
      onUpdate()
    } else {
      setError(result.error || 'Failed to remove logo')
    }

    setSaving(false)
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Branding</h2>
      <p className="text-gray-600 mb-6">
        Customize the appearance of your booking pages
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
        {/* Brand Color */}
        <div>
          <Label htmlFor="brandColor">Brand Color</Label>
          <div className="flex items-center gap-4 mt-2">
            <input
              id="brandColor"
              type="color"
              value={brandColor}
              onChange={handleColorChange}
              className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
            />
            <Input
              type="text"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              placeholder="#3B82F6"
              className="flex-1"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            This color will be used for buttons and accents on your booking pages
          </p>
          
          {/* Color Preview */}
          <div className="mt-4 p-4 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium mb-3">Preview</p>
            <div className="flex gap-3">
              <button
                style={{ backgroundColor: brandColor }}
                className="px-4 py-2 text-white rounded-md font-medium"
              >
                Book Meeting
              </button>
              <button
                style={{ borderColor: brandColor, color: brandColor }}
                className="px-4 py-2 border-2 rounded-md font-medium"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div>
          <Label htmlFor="logo">Logo</Label>
          <div className="mt-2">
            {logoUrl && (
              <div className="mb-4 flex items-center gap-4">
                <img
                  src={logoUrl}
                  alt="Brand logo"
                  className="h-16 w-auto object-contain border border-gray-200 rounded p-2"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveLogo}
                  disabled={saving}
                  size="sm"
                >
                  Remove Logo
                </Button>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={uploadingLogo}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('logo')?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              PNG or SVG recommended. Max size 2MB.
            </p>
          </div>
        </div>

        {/* Custom Domain (placeholder for future implementation) */}
        <div>
          <Label htmlFor="customDomain">Custom Domain</Label>
          <Input
            id="customDomain"
            type="text"
            placeholder="booking.yourdomain.com"
            disabled
            className="mt-2 bg-gray-50"
          />
          <p className="text-sm text-gray-500 mt-2">
            Custom domains are coming soon. Contact support for early access.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Branding'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
