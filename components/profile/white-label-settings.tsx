'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface WhiteLabelSettingsProps {
  userId: string
  currentSettings: {
    isPremium: boolean
    hidePlatformBranding: boolean
    customFooter: string | null
    customHeader: string | null
    emailBrandingEnabled: boolean
    metaTitle: string | null
    metaDescription: string | null
    metaImage: string | null
  }
  onUpdate: () => void
}

export function WhiteLabelSettings({ userId, currentSettings, onUpdate }: WhiteLabelSettingsProps) {
  const [hidePlatformBranding, setHidePlatformBranding] = useState(
    currentSettings.hidePlatformBranding
  )
  const [customFooter, setCustomFooter] = useState(currentSettings.customFooter || '')
  const [customHeader, setCustomHeader] = useState(currentSettings.customHeader || '')
  const [emailBrandingEnabled, setEmailBrandingEnabled] = useState(
    currentSettings.emailBrandingEnabled
  )
  const [metaTitle, setMetaTitle] = useState(currentSettings.metaTitle || '')
  const [metaDescription, setMetaDescription] = useState(currentSettings.metaDescription || '')
  const [metaImage, setMetaImage] = useState(currentSettings.metaImage || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isPremium = currentSettings.isPremium

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/user/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hidePlatformBranding,
          customFooter: customFooter.trim() || undefined,
          customHeader: customHeader.trim() || undefined,
          emailBrandingEnabled,
          metaTitle: metaTitle.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
          metaImage: metaImage.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('White-label settings saved successfully')
        onUpdate()
      } else {
        setError(result.error || 'Failed to save settings')
      }
    } catch (err) {
      setError('Failed to save settings')
    }

    setSaving(false)
  }

  if (!isPremium) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Badge variant="secondary" className="mb-4 text-lg px-4 py-2">
            Premium Feature
          </Badge>
          <h2 className="text-2xl font-semibold mb-3">White-Label Options</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Remove platform branding and customize your booking pages with your own branding.
            Available with Premium plan.
          </p>
          <Button size="lg">Upgrade to Premium</Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">White-Label Options</h2>
        <Badge>Premium</Badge>
      </div>
      <p className="text-gray-600 mb-6">
        Customize your booking pages with your own branding and remove platform references
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

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          {/* Hide Platform Branding */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="hidePlatformBranding" className="text-base font-medium">
                Hide Platform Branding
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Remove "Powered by Scheduler" from your booking pages
              </p>
            </div>
            <Switch
              id="hidePlatformBranding"
              checked={hidePlatformBranding}
              onCheckedChange={setHidePlatformBranding}
            />
          </div>

          {/* Custom Header */}
          <div>
            <Label htmlFor="customHeader">Custom Header</Label>
            <Textarea
              id="customHeader"
              value={customHeader}
              onChange={(e) => setCustomHeader(e.target.value)}
              placeholder="<div>Your custom header HTML</div>"
              className="mt-2 font-mono text-sm min-h-[100px]"
              maxLength={2000}
            />
            <p className="text-sm text-gray-500 mt-2">
              Add custom HTML to appear at the top of your booking pages. Max 2000 characters.
            </p>
          </div>

          {/* Custom Footer */}
          <div>
            <Label htmlFor="customFooter">Custom Footer</Label>
            <Textarea
              id="customFooter"
              value={customFooter}
              onChange={(e) => setCustomFooter(e.target.value)}
              placeholder="<div>© 2024 Your Company. All rights reserved.</div>"
              className="mt-2 font-mono text-sm min-h-[100px]"
              maxLength={2000}
            />
            <p className="text-sm text-gray-500 mt-2">
              Add custom HTML to appear at the bottom of your booking pages. Max 2000 characters.
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="font-medium mb-3">Preview</h3>
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
              {customHeader && (
                <div
                  className="p-3 border-b border-gray-200 bg-gray-50"
                  dangerouslySetInnerHTML={{ __html: customHeader }}
                />
              )}
              <div className="p-6 text-center text-gray-500">
                <p>Booking Page Content</p>
              </div>
              {customFooter && (
                <div
                  className="p-3 border-t border-gray-200 bg-gray-50"
                  dangerouslySetInnerHTML={{ __html: customFooter }}
                />
              )}
              {!hidePlatformBranding && (
                <div className="p-2 text-center text-xs text-gray-400 border-t border-gray-200">
                  Powered by Scheduler
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          {/* Email Branding */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="emailBrandingEnabled" className="text-base font-medium">
                Custom Email Branding
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Use your logo and colors in booking confirmation emails
              </p>
            </div>
            <Switch
              id="emailBrandingEnabled"
              checked={emailBrandingEnabled}
              onCheckedChange={setEmailBrandingEnabled}
            />
          </div>

          {emailBrandingEnabled && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 text-sm mb-2">Email Branding Active</h3>
              <p className="text-sm text-blue-800 mb-3">
                Your booking confirmation emails will use:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Your logo from branding settings</li>
                <li>Your brand color for buttons and accents</li>
                <li>Custom footer text (if configured)</li>
                <li>No platform branding (if hidden)</li>
              </ul>
            </div>
          )}

          {/* Email Preview */}
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="font-medium mb-3">Email Preview</h3>
            <div className="bg-white rounded border border-gray-200 p-6 space-y-4">
              <div className="text-center pb-4 border-b border-gray-200">
                <div className="text-sm text-gray-500 mb-2">Your Logo Here</div>
                <h2 className="text-xl font-semibold">Booking Confirmed</h2>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Your meeting has been scheduled.</p>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">Meeting Details</p>
                </div>
              </div>
              <button
                className="w-full py-2 rounded text-white font-medium"
                style={{ backgroundColor: '#3B82F6' }}
              >
                Add to Calendar
              </button>
              {!hidePlatformBranding && (
                <div className="pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                  Sent via Scheduler
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <h3 className="font-semibold text-blue-900 text-sm mb-2">SEO Customization</h3>
            <p className="text-sm text-blue-800">
              Customize how your booking pages appear in search results and social media shares
            </p>
          </div>

          {/* Meta Title */}
          <div>
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Book a meeting with [Your Name]"
              className="mt-2"
              maxLength={60}
            />
            <p className="text-sm text-gray-500 mt-2">
              Appears in search results and browser tabs. Max 60 characters.
            </p>
          </div>

          {/* Meta Description */}
          <div>
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Schedule a meeting with me to discuss..."
              className="mt-2"
              maxLength={160}
            />
            <p className="text-sm text-gray-500 mt-2">
              Appears in search results. Max 160 characters.
            </p>
          </div>

          {/* Meta Image */}
          <div>
            <Label htmlFor="metaImage">Social Share Image URL</Label>
            <Input
              id="metaImage"
              value={metaImage}
              onChange={(e) => setMetaImage(e.target.value)}
              placeholder="https://yourdomain.com/og-image.jpg"
              className="mt-2"
              type="url"
            />
            <p className="text-sm text-gray-500 mt-2">
              Image shown when your booking page is shared on social media. Recommended: 1200x630px
            </p>
          </div>

          {/* SEO Preview */}
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="font-medium mb-3">Search Result Preview</h3>
            <div className="bg-white rounded p-4">
              <div className="text-blue-600 text-sm mb-1">
                {metaTitle || 'Book a meeting with [Your Name]'}
              </div>
              <div className="text-green-700 text-xs mb-2">
                https://yourdomain.com/booking
              </div>
              <div className="text-sm text-gray-600">
                {metaDescription || 'Schedule a meeting to discuss your needs...'}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-6 border-t mt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save White-Label Settings'}
        </Button>
      </div>
    </Card>
  )
}
