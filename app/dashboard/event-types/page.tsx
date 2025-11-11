import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth/protected-route'
import { serverEventTypeService } from '@/services/event-type-service'
import { EventTypeListClient } from './event-type-list-client'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function EventTypesPage() {
  const user = await requireAuth()
  const eventTypes = await serverEventTypeService.getEventTypes(user.id, true)

  return (
    <DashboardLayout userEmail={user.email || undefined}>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Types</h1>
            <p className="text-gray-600 mt-1">
              Create and manage your scheduling event types
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/event-types/new">
              <Plus className="h-4 w-4 mr-2" />
              New Event Type
            </Link>
          </Button>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <EventTypeListClient initialEventTypes={eventTypes} />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}
