'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ThemePreview } from './theme-preview'

interface BookingPageCustomizationProps {
  userId: string
  currentSettings: {
    layout?: 'default' | 'centered' | 'split'
    customCSS?: string
    brandColor: string | null
    logoUrl: string | null
  }
  userName: string
  onUpdate: () => void
}

const LAYOUT_OPTIONS = [
  {
    value: 'default',
    label: 'Default',
    description: 'Sidebar layout with event details on the left',
    preview: '📱 | 📅📅',
  },
  {
    value: 'centered',
    label: 'Centered',
    description: 'Stacked layout with centered content',
    preview: '📱\n📅',
  },
  {
    value: 'split',
    label: 'Split',
    description: 'Equal split layout for larger screens',
    preview: '📱 | 📅',
  },
]

export function BookingPageCustomization({
  userId,
  currentSettings,
  userName,
  onUpdate,
}: BookingPageCustomizationProps) {
  const [layout, setLayout] = useState<'default' | 'centered' | 'split'>(
    currentSettings.layout || 'default'
  )
  const [customCSS, setCustomCSS] = useState(currentSettings.customCSS || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/user/booking-customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layout,
          customCSS: customCSS.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Booking page customization saved successfully')
        onUpdate()
      } else {
        setError(result.error || 'Failed to save customization')
      }
    } catch (err) {
      setError('Failed to save customization')
    }

    setSaving(false)
  }

  const handleReset = () => {
    setLayout('default')
    setCustomCSS('')
    setSuccess('Settings reset to defaults')
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Booking Page Customization</h2>
      <p className="text-gray-600 mb-6">
        Customize the layout and appearance of your booking pages
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

      <Tabs defaultValue="layout" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="css">Custom CSS</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="space-y-4">
          <div>
            <Label>Page Layout</Label>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              {LAYOUT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLayout(option.value as any)}
                  className={`p-4 border-2 rounded-lg text-left transition-all hover:border-gray-400 ${
                    layout === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="text-2xl mb-2 text-center whitespace-pre-line">
                    {option.preview}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{option.label}</h3>
                  <p className="text-xs text-gray-600">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">Selected Layout: {layout}</h3>
            <p className="text-sm text-gray-600">
              {LAYOUT_OPTIONS.find((o) => o.value === layout)?.description}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="css" className="space-y-4">
          <div>
            <Label htmlFor="customCSS">Custom CSS</Label>
            <Textarea
              id="customCSS"
              value={customCSS}
              onChange={(e) => setCustomCSS(e.target.value)}
              placeholder=".booking-page { background: #f0f0f0; }"
              className="mt-2 font-mono text-sm min-h-[300px]"
            />
            <p className="text-sm text-gray-500 mt-2">
              Add custom CSS to further customize your booking page appearance. Use with caution.
            </p>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-900 text-sm mb-2">⚠️ Advanced Feature</h3>
            <p className="text-sm text-yellow-800">
              Custom CSS can affect page layout and functionality. Test thoroughly before saving.
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 text-sm mb-2">Available CSS Variables</h3>
            <ul className="text-sm text-blue-800 space-y-1 font-mono">
              <li>--brand-color: Your brand color</li>
              <li>.btn-primary: Primary button styling</li>
              <li>.border-brand: Brand color border</li>
              <li>.text-brand: Brand color text</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Live Preview</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? 'Exit Preview' : 'Enter Preview Mode'}
              </Button>
            </div>

            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 text-center text-xs text-gray-600 font-mono">
                  booking.yourdomain.com/30min
                </div>
              </div>

              <div className="bg-white p-4 max-h-[600px] overflow-auto">
                <ThemePreview
                  brandColor={currentSettings.brandColor || '#3B82F6'}
                  logoUrl={currentSettings.logoUrl}
                  userName={userName}
                  eventTitle="30 Minute Meeting"
                />
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-3">
              This preview shows how your branding will appear on booking pages. Layout changes
              will be visible when guests book meetings.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between pt-6 border-t mt-6">
        <Button type="button" variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Customization'}
        </Button>
      </div>
    </Card>
  )
}
