import { requireAuth } from '@/lib/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { EventTypeForm } from '@/components/event-types/event-type-form'

export default async function NewEventTypePage() {
  const user = await requireAuth()

  return (
    <DashboardLayout userEmail={user.email || undefined}>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create Event Type</h1>
          <p className="text-gray-600 mt-1">
            Set up a new event type for your scheduling page
          </p>
        </div>

        <EventTypeForm userId={user.id} />
      </div>
    </DashboardLayout>
  )
}
