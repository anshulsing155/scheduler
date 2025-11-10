'use client'

import { useState, useRef } from 'react'
import { userService } from '@/services/user-service.client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BrandingSettingsProps {
  userId: string
  currentBranding: {
    brandColor: string | null
    logoUrl: string | null
  }
  onUpdate: () => void
}

// Preset color palette
const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Green
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16', // Lime
  '#A855F7', // Violet
]

export function BrandingSettings({ userId, currentBranding, onUpdate }: BrandingSettingsProps) {
  const [brandColor, setBrandColor] = useState(currentBranding.brandColor || '#3B82F6')
  const [logoUrl, setLogoUrl] = useState(currentBranding.logoUrl || '')
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleColorChange = (color: string) => {
    // Validate hex color format
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      setBrandColor(color)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

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
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
          
          <Tabs defaultValue="presets" className="mt-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="presets">Presets</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
            
            <TabsContent value="presets" className="space-y-3">
              <div className="grid grid-cols-6 gap-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`h-12 w-full rounded-lg border-2 transition-all hover:scale-105 ${
                      brandColor === color ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="space-y-3">
              <div className="flex items-center gap-4">
                <input
                  id="brandColor"
                  type="color"
                  value={brandColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  type="text"
                  value={brandColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  maxLength={7}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <p className="text-sm text-gray-500 mt-2">
            This color will be used for buttons and accents on your booking pages
          </p>
        </div>

        {/* Theme Preview */}
        <div>
          <Label>Theme Preview</Label>
          <div className="mt-3 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              {/* Mock booking page header */}
              <div className="flex items-center gap-3 mb-6">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-10 w-auto object-contain"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">Logo</span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">Your Name</h3>
                  <p className="text-sm text-gray-500">30 Minute Meeting</p>
                </div>
              </div>
              
              {/* Mock booking form */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Select a time</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {['9:00 AM', '10:00 AM', '11:00 AM'].map((time) => (
                      <button
                        key={time}
                        style={{ 
                          backgroundColor: time === '10:00 AM' ? brandColor : 'white',
                          borderColor: time === '10:00 AM' ? brandColor : '#E5E7EB',
                          color: time === '10:00 AM' ? 'white' : '#374151'
                        }}
                        className="px-3 py-2 text-sm border-2 rounded-md font-medium transition-colors"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  style={{ backgroundColor: brandColor }}
                  className="w-full px-4 py-3 text-white rounded-md font-medium shadow-sm hover:opacity-90 transition-opacity"
                >
                  Confirm Booking
                </button>
                
                <button
                  style={{ borderColor: brandColor, color: brandColor }}
                  className="w-full px-4 py-3 border-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div>
          <Label htmlFor="logo">Logo</Label>
          <div className="mt-2">
            {logoUrl && (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={logoUrl}
                    alt="Brand logo"
                    className="h-16 w-auto object-contain bg-white border border-gray-200 rounded p-2"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Current Logo</p>
                    <p className="text-xs text-gray-500">Displayed on your booking pages</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveLogo}
                  disabled={saving}
                  size="sm"
                >
                  Remove
                </Button>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                id="logo"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={uploadingLogo}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              PNG, JPG, SVG, or WebP. Max size 2MB. Transparent background recommended.
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

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Branding'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
