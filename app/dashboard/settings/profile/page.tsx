'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { userService, type UserProfile } from '@/services/user-service.client'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { TimezoneSelector } from '@/components/profile/timezone-selector'
import { BrandingSettings } from '@/components/profile/branding-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export default function ProfileSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    timezone: 'UTC',
    weekStart: 0,
    timeFormat: '12h' as '12h' | '24h',
    dateFormat: 'MM/DD/YYYY',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    const result = await userService.getCurrentProfile()

    if (result.success && result.data) {
      setProfile(result.data)
      setFormData({
        name: result.data.name || '',
        bio: result.data.bio || '',
        timezone: result.data.timezone,
        weekStart: result.data.weekStart,
        timeFormat: (result.data.timeFormat === '24h' ? '24h' : '12h') as '12h' | '24h',
        dateFormat: result.data.dateFormat,
      })
    } else {
      setError(result.error || 'Failed to load profile')
    }

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    const result = await userService.updateProfile(profile.id, formData)

    if (result.success) {
      setSuccess('Profile updated successfully')
      setProfile(result.data!)
    } else {
      setError(result.error || 'Failed to update profile')
    }

    setSaving(false)
  }

  const handleAvatarUpload = async (file: File) => {
    if (!profile) return

    const result = await userService.uploadAvatar(profile.id, file)

    if (result.success) {
      setSuccess('Avatar updated successfully')
      await loadProfile()
    } else {
      setError(result.error || 'Failed to upload avatar')
    }
  }

  const handleTimezoneChange = (timezone: string) => {
    setFormData({ ...formData, timezone })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Failed to load profile</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-gray-600 mt-2">Manage your personal information and preferences</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Avatar Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Photo</h2>
          <AvatarUpload
            currentAvatarUrl={profile.avatarUrl}
            onUpload={handleAvatarUpload}
            userName={profile.name || profile.username}
          />
        </Card>

        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={profile.username}
                disabled
                className="mt-1 bg-gray-50"
              />
              <p className="text-sm text-gray-500 mt-1">
                Your public booking URL: {window.location.origin}/{profile.username}
              </p>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <TimezoneSelector
                value={formData.timezone}
                onChange={handleTimezoneChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weekStart">Week Starts On</Label>
                <select
                  id="weekStart"
                  value={formData.weekStart}
                  onChange={(e) => setFormData({ ...formData, weekStart: parseInt(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={6}>Saturday</option>
                </select>
              </div>

              <div>
                <Label htmlFor="timeFormat">Time Format</Label>
                <select
                  id="timeFormat"
                  value={formData.timeFormat}
                  onChange={(e) => setFormData({ ...formData, timeFormat: e.target.value as '12h' | '24h' })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="12h">12-hour (2:00 PM)</option>
                  <option value="24h">24-hour (14:00)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Branding Settings */}
        <BrandingSettings
          userId={profile.id}
          currentBranding={{
            brandColor: profile.brandColor,
            logoUrl: profile.logoUrl,
          }}
          onUpdate={loadProfile}
        />
      </div>
    </div>
  )
}
