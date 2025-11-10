'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EventTypeWithRelations, eventTypeService } from '@/services/event-type-service'
import { EventTypeList } from '@/components/event-types/event-type-list'
import { DeleteEventTypeDialog } from '@/components/event-types/delete-event-type-dialog'

interface EventTypeListClientProps {
  initialEventTypes: EventTypeWithRelations[]
}

export function EventTypeListClient({ initialEventTypes }: EventTypeListClientProps) {
  const router = useRouter()
  const [eventTypes, setEventTypes] = useState(initialEventTypes)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventTypeToDelete, setEventTypeToDelete] = useState<EventTypeWithRelations | null>(null)

  const handleEdit = (eventType: EventTypeWithRelations) => {
    router.push(`/dashboard/event-types/${eventType.id}/edit`)
  }

  const handleDelete = (eventType: EventTypeWithRelations) => {
    setEventTypeToDelete(eventType)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async (eventType: EventTypeWithRelations) => {
    const result = await eventTypeService.deleteEventType(eventType.id)

    if (result.success) {
      setEventTypes((prev) => prev.filter((et) => et.id !== eventType.id))
      router.refresh()
    }
  }

  const handleDuplicate = async (eventType: EventTypeWithRelations) => {
    const result = await eventTypeService.duplicateEventType(eventType.id)

    if (result.success && result.data) {
      setEventTypes((prev) => [result.data!, ...prev])
      router.refresh()
    }
  }

  const handleToggleActive = async (eventType: EventTypeWithRelations, isActive: boolean) => {
    const result = await eventTypeService.toggleActive(eventType.id, isActive)

    if (result.success && result.data) {
      setEventTypes((prev) =>
        prev.map((et) => (et.id === eventType.id ? result.data! : et))
      )
      router.refresh()
    }
  }

  return (
    <>
      <EventTypeList
        eventTypes={eventTypes}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onToggleActive={handleToggleActive}
      />

      <DeleteEventTypeDialog
        eventType={eventTypeToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
