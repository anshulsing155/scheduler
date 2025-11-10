'use client'

import { useState } from 'react'
import { EventTypeWithRelations } from '@/services/event-type-service'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface DeleteEventTypeDialogProps {
  eventType: EventTypeWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (eventType: EventTypeWithRelations) => Promise<void>
}

export function DeleteEventTypeDialog({
  eventType,
  open,
  onOpenChange,
  onConfirm,
}: DeleteEventTypeDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    if (!eventType) return

    setIsDeleting(true)
    try {
      await onConfirm(eventType)
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting event type:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!eventType) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Event Type</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{eventType.title}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {eventType._count && eventType._count.bookings > 0 && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
            Warning: This event type has {eventType._count.bookings} booking
            {eventType._count.bookings !== 1 ? 's' : ''}. Deleting it will also delete all associated
            bookings.
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Event Type
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
