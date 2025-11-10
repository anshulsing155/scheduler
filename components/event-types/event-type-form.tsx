'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { LocationType } from '@prisma/client'
import {
  createEventTypeSchema,
  CreateEventTypeData,
  eventTypeService,
  generateSlug,
  CustomQuestion,
} from '@/services/event-type-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DurationSelector } from './duration-selector'
import { LocationSettings } from './location-settings'
import { CustomQuestions } from './custom-questions'
import { BufferTimeSettings } from './buffer-time-settings'
import { BookingWindowSettings } from './booking-window-settings'
import { Loader2 } from 'lucide-react'

interface EventTypeFormProps {
  userId: string
  initialData?: Partial<CreateEventTypeData>
  eventTypeId?: string
  onSuccess?: () => void
}

export function EventTypeForm({ userId, initialData, eventTypeId, onSuccess }: EventTypeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateEventTypeData>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    duration: initialData?.duration || 30,
    locationType: initialData?.locationType || LocationType.VIDEO_ZOOM,
    locationDetails: initialData?.locationDetails || '',
    minimumNotice: initialData?.minimumNotice || 0,
    bufferTimeBefore: initialData?.bufferTimeBefore || 0,
    bufferTimeAfter: initialData?.bufferTimeAfter || 0,
    maxBookingWindow: initialData?.maxBookingWindow || 60,
    price: initialData?.price,
    currency: initialData?.currency || 'USD',
    color: initialData?.color || '#3b82f6',
    customQuestions: (initialData?.customQuestions as CustomQuestion[]) || [],
    isActive: initialData?.isActive ?? true,
  })

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate data
      const validatedData = createEventTypeSchema.parse(formData)

      let result
      if (eventTypeId) {
        // Update existing event type
        result = await eventTypeService.updateEventType(eventTypeId, validatedData)
      } else {
        // Create new event type
        result = await eventTypeService.createEventType(userId, validatedData)
      }

      if (result.success) {
        onSuccess?.()
        router.push('/dashboard/event-types')
        router.refresh()
      } else {
        setError(result.error || 'Failed to save event type')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Set up the basic details of your event type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="30 Minute Meeting"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">your-username/</span>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="30-minute-meeting"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This will be part of your booking page URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this meeting is about..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Event Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#3b82f6"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Duration & Location</CardTitle>
          <CardDescription>Configure meeting duration and location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DurationSelector
            value={formData.duration}
            onChange={(duration) => setFormData({ ...formData, duration })}
          />

          <LocationSettings
            locationType={formData.locationType}
            locationDetails={formData.locationDetails}
            onLocationTypeChange={(locationType) => setFormData({ ...formData, locationType })}
            onLocationDetailsChange={(locationDetails) => setFormData({ ...formData, locationDetails })}
          />
        </CardContent>
      </Card>

      <BufferTimeSettings
        bufferTimeBefore={formData.bufferTimeBefore}
        bufferTimeAfter={formData.bufferTimeAfter}
        onBufferTimeBeforeChange={(bufferTimeBefore) => setFormData({ ...formData, bufferTimeBefore })}
        onBufferTimeAfterChange={(bufferTimeAfter) => setFormData({ ...formData, bufferTimeAfter })}
      />

      <BookingWindowSettings
        minimumNotice={formData.minimumNotice}
        maxBookingWindow={formData.maxBookingWindow}
        onMinimumNoticeChange={(minimumNotice) => setFormData({ ...formData, minimumNotice })}
        onMaxBookingWindowChange={(maxBookingWindow) => setFormData({ ...formData, maxBookingWindow })}
      />

      <Card>
        <CardHeader>
          <CardTitle>Custom Questions</CardTitle>
          <CardDescription>Collect additional information from guests</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomQuestions
            questions={formData.customQuestions || []}
            onChange={(customQuestions) => setFormData({ ...formData, customQuestions })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment (Optional)</CardTitle>
          <CardDescription>Charge for this event type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="USD"
                maxLength={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {eventTypeId ? 'Update Event Type' : 'Create Event Type'}
        </Button>
      </div>
    </form>
  )
}
