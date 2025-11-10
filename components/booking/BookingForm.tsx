'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Clock, MapPin, Video, Phone, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EventTypeWithRelations, CustomQuestion } from '@/services/event-type-service'

interface BookingFormProps {
  eventType: EventTypeWithRelations & {
    user: {
      id: string
      username: string
      name: string | null
      avatarUrl: string | null
      timezone: string
      brandColor: string | null
      logoUrl: string | null
    }
  }
  selectedSlot: {
    startTime: string
    endTime: string
  }
  guestTimezone: string
  onBack: () => void
}

// Phone number validation regex (international format)
const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/

// Create base schema
const createBookingSchema = (customQuestions?: CustomQuestion[]) => {
  const baseSchema = {
    guestName: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    guestEmail: z.string().email('Invalid email address'),
    guestPhone: z
      .string()
      .optional()
      .refine((val) => !val || phoneRegex.test(val), {
        message: 'Invalid phone number format',
      }),
    notes: z.string().max(500, 'Notes are too long').optional(),
  }

  // Add custom questions to schema
  if (customQuestions && customQuestions.length > 0) {
    const customFields: Record<string, z.ZodTypeAny> = {}

    customQuestions.forEach((question) => {
      const fieldKey = `custom_${question.id}`

      if (question.required) {
        if (question.type === 'checkbox') {
          customFields[fieldKey] = z.array(z.string()).min(1, `${question.question} is required`)
        } else {
          customFields[fieldKey] = z.string().min(1, `${question.question} is required`)
        }
      } else {
        if (question.type === 'checkbox') {
          customFields[fieldKey] = z.array(z.string()).optional()
        } else {
          customFields[fieldKey] = z.string().optional()
        }
      }
    })

    return z.object({ ...baseSchema, ...customFields })
  }

  return z.object(baseSchema)
}

export default function BookingForm({ eventType, selectedSlot, guestTimezone, onBack }: BookingFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const customQuestions = (eventType.customQuestions as CustomQuestion[]) || []
  const bookingSchema = createBookingSchema(customQuestions)
  type BookingFormData = z.infer<typeof bookingSchema>

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      notes: '',
    },
  })

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    const zonedDate = toZonedTime(date, guestTimezone)
    return {
      date: format(zonedDate, 'EEEE, MMMM d, yyyy'),
      time: format(zonedDate, 'h:mm a'),
    }
  }

  const startDateTime = formatDateTime(selectedSlot.startTime)

  const getLocationIcon = () => {
    switch (eventType.locationType) {
      case 'VIDEO_ZOOM':
      case 'VIDEO_GOOGLE_MEET':
      case 'VIDEO_TEAMS':
        return <Video className="h-4 w-4" />
      case 'PHONE':
        return <Phone className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const getLocationLabel = () => {
    switch (eventType.locationType) {
      case 'VIDEO_ZOOM':
        return 'Zoom Meeting'
      case 'VIDEO_GOOGLE_MEET':
        return 'Google Meet'
      case 'VIDEO_TEAMS':
        return 'Microsoft Teams'
      case 'PHONE':
        return 'Phone Call'
      case 'IN_PERSON':
        return eventType.locationDetails || 'In Person'
      case 'CUSTOM':
        return eventType.locationDetails || 'Custom Location'
      default:
        return 'Location TBD'
    }
  }

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Extract custom responses
      const customResponses: Record<string, any> = {}
      customQuestions.forEach((question) => {
        const fieldKey = `custom_${question.id}` as keyof BookingFormData
        if (data[fieldKey]) {
          customResponses[question.id] = data[fieldKey]
        }
      })

      const bookingData = {
        eventTypeId: eventType.id,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone || null,
        guestTimezone,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        customResponses: Object.keys(customResponses).length > 0 ? customResponses : null,
        notes: data.notes || null,
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create booking')
      }

      const result = await response.json()

      // Redirect to confirmation page
      router.push(`/booking/${result.booking.id}/confirmed`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCustomQuestion = (question: CustomQuestion) => {
    const fieldKey = `custom_${question.id}` as any

    switch (question.type) {
      case 'text':
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={fieldKey}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Your answer" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'textarea':
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={fieldKey}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Your answer" rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'select':
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={fieldKey}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select an option</option>
                    {question.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'radio':
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={fieldKey}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {question.options?.map((option) => (
                      <label key={option} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          {...field}
                          value={option}
                          checked={field.value === option}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'checkbox':
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={fieldKey}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {question.options?.map((option) => (
                      <label key={option} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          value={option}
                          checked={(field.value as string[] || []).includes(option)}
                          onChange={(e) => {
                            const currentValue = (field.value as string[]) || []
                            const newValue = e.target.checked
                              ? [...currentValue, option]
                              : currentValue.filter((v) => v !== option)
                            field.onChange(newValue)
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <Button variant="ghost" size="sm" onClick={onBack} className="w-fit mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <CardTitle>Enter Details</CardTitle>
        <CardDescription>Please provide your information to complete the booking</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Booking Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
          <h3 className="font-semibold text-lg">{eventType.title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{startDateTime.date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              {startDateTime.time} ({eventType.duration} minutes)
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {getLocationIcon()}
            <span>{getLocationLabel()}</span>
          </div>
          {eventType.price && (
            <div className="text-sm font-semibold text-gray-900 mt-2">
              Price:{' '}
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: eventType.currency || 'USD',
              }).format(Number(eventType.price))}
            </div>
          )}
        </div>

        {/* Booking Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="guestName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guestEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="john@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guestPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" placeholder="+1 (555) 123-4567" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Questions */}
            {customQuestions.map((question) => renderCustomQuestion(question))}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Any additional information..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                'Schedule Event'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
