'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

interface NotificationSettings {
  id: string
  userId: string
  emailEnabled: boolean
  smsEnabled: boolean
  phoneNumber: string | null
  reminderTiming: number[]
}

interface NotificationSettingsClientProps {
  userId: string
}

export default function NotificationSettingsClient({ userId }: NotificationSettingsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingSMS, setTestingSMS] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings | null>(null)

  // Form state
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [reminderTiming, setReminderTiming] = useState<number[]>([1440, 60])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings')
      if (!response.ok) throw new Error('Failed to fetch settings')
      
      const data = await response.json()
      setSettings(data.settings)
      setEmailEnabled(data.settings.emailEnabled)
      setSmsEnabled(data.settings.smsEnabled)
      setPhoneNumber(data.settings.phoneNumber || '')
      setReminderTiming(data.settings.reminderTiming)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notification settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailEnabled,
          smsEnabled,
          phoneNumber: phoneNumber || null,
          reminderTiming,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      toast({
        title: 'Success',
        description: 'Notification settings saved successfully',
      })

      fetchSettings()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestSMS = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number first',
        variant: 'destructive',
      })
      return
    }

    setTestingSMS(true)
    try {
      const response = await fetch('/api/notifications/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send test SMS')
      }

      toast({
        title: 'Success',
        description: 'Test SMS sent successfully! Check your phone.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send test SMS',
        variant: 'destructive',
      })
    } finally {
      setTestingSMS(false)
    }
  }

  const toggleReminderTime = (minutes: number) => {
    if (reminderTiming.includes(minutes)) {
      setReminderTiming(reminderTiming.filter((t) => t !== minutes))
    } else {
      setReminderTiming([...reminderTiming, minutes].sort((a, b) => b - a))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage how and when you receive notifications about your bookings
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="email-enabled" className="text-base font-semibold">
                Email Notifications
              </Label>
              <p className="text-sm text-gray-600">
                Receive booking confirmations, reminders, and updates via email
              </p>
            </div>
            <Switch
              id="email-enabled"
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
            />
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="sms-enabled" className="text-base font-semibold">
                SMS Notifications
              </Label>
              <p className="text-sm text-gray-600">
                Receive booking reminders via text message
              </p>
            </div>
            <Switch
              id="sms-enabled"
              checked={smsEnabled}
              onCheckedChange={setSmsEnabled}
            />
          </div>

          {smsEnabled && (
            <div className="space-y-3 pl-4 border-l-2 border-blue-200">
              <div>
                <Label htmlFor="phone-number" className="text-sm font-medium">
                  Phone Number
                </Label>
                <div className="flex gap-2 mt-1">
                  <input
                    id="phone-number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestSMS}
                    disabled={testingSMS || !phoneNumber}
                  >
                    {testingSMS ? 'Sending...' : 'Test SMS'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your phone number in international format (e.g., +1234567890)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Reminder Timing */}
        <div className="space-y-4 pt-6 border-t">
          <div className="space-y-1">
            <Label className="text-base font-semibold">Reminder Timing</Label>
            <p className="text-sm text-gray-600">
              Choose when to receive reminders before your meetings
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-4">
            {[
              { label: '1 week before', minutes: 10080 },
              { label: '3 days before', minutes: 4320 },
              { label: '1 day before', minutes: 1440 },
              { label: '12 hours before', minutes: 720 },
              { label: '1 hour before', minutes: 60 },
              { label: '15 minutes before', minutes: 15 },
            ].map((option) => (
              <button
                key={option.minutes}
                type="button"
                onClick={() => toggleReminderTime(option.minutes)}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  reminderTiming.includes(option.minutes)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {reminderTiming.length === 0 && (
            <p className="text-sm text-amber-600 pl-4">
              ⚠️ Please select at least one reminder time
            </p>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-6 border-t flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || reminderTiming.length === 0}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 About Notifications</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Email notifications are sent for all booking events (confirmations, cancellations, reschedules)</li>
          <li>• SMS notifications are only sent for reminders before meetings</li>
          <li>• You can select multiple reminder times to receive notifications at different intervals</li>
          <li>• Standard SMS rates may apply depending on your carrier</li>
        </ul>
      </div>
    </div>
  )
}
