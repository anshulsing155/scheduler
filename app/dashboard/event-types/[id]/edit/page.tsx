import { requireAuth } from '@/lib/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { serverEventTypeService } from '@/services/event-type-service'
import { EventTypeForm } from '@/components/event-types/event-type-form'
import { redirect, notFound } from 'next/navigation'

export default async function EditEventTypePage({ params }: { params: { id: string } }) {
  const user = await requireAuth()
  const eventType = await serverEventTypeService.getEventType(params.id)

  if (!eventType) {
    notFound()
  }

  if (eventType.userId !== user.id) {
    redirect('/dashboard/event-types')
  }

  return (
    <DashboardLayout userEmail={user.email || undefined}>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Event Type</h1>
          <p className="text-gray-600 mt-1">
            Update your event type settings
          </p>
        </div>

        <EventTypeForm
          userId={user.id}
          eventTypeId={eventType.id}
          initialData={{
            title: eventType.title,
            slug: eventType.slug,
            description: eventType.description || undefined,
            duration: eventType.duration,
            locationType: eventType.locationType,
            locationDetails: eventType.locationDetails || undefined,
            minimumNotice: eventType.minimumNotice,
            bufferTimeBefore: eventType.bufferTimeBefore,
            bufferTimeAfter: eventType.bufferTimeAfter,
            maxBookingWindow: eventType.maxBookingWindow,
            price: eventType.price ? parseFloat(eventType.price.toString()) : undefined,
            currency: eventType.currency || undefined,
            color: eventType.color || undefined,
            customQuestions: eventType.customQuestions as any,
            isActive: eventType.isActive,
          }}
        />
      </div>
    </DashboardLayout>
  )
}
