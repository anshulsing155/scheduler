import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { serverEventTypeService } from '@/services/event-type-service'
import { EventTypeListClient } from './event-type-list-client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function EventTypesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please log in to view your event types</div>
  }

  const eventTypes = await serverEventTypeService.getEventTypes(user.id, true)

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Types</h1>
          <p className="text-muted-foreground mt-1">
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
  )
}
