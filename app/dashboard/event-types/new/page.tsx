import { createClient } from '@/lib/supabase/server'
import { EventTypeForm } from '@/components/event-types/event-type-form'
import { redirect } from 'next/navigation'

export default async function NewEventTypePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Event Type</h1>
        <p className="text-muted-foreground mt-1">
          Set up a new event type for your scheduling page
        </p>
      </div>

      <EventTypeForm userId={user.id} />
    </div>
  )
}
