'use client'

import { useState } from 'react'
import { EventTypeWithRelations } from '@/services/event-type-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Clock, MapPin, Copy, Pencil, Trash2, ExternalLink, LayoutGrid, LayoutList } from 'lucide-react'
import Link from 'next/link'

interface EventTypeListProps {
  eventTypes: EventTypeWithRelations[]
  onEdit?: (eventType: EventTypeWithRelations) => void
  onDelete?: (eventType: EventTypeWithRelations) => void
  onDuplicate?: (eventType: EventTypeWithRelations) => void
  onToggleActive?: (eventType: EventTypeWithRelations, isActive: boolean) => void
}

export function EventTypeList({
  eventTypes,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleActive,
}: EventTypeListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const getLocationLabel = (locationType: string) => {
    const labels: Record<string, string> = {
      VIDEO_ZOOM: 'Zoom',
      VIDEO_GOOGLE_MEET: 'Google Meet',
      VIDEO_TEAMS: 'Microsoft Teams',
      PHONE: 'Phone',
      IN_PERSON: 'In Person',
      CUSTOM: 'Custom',
    }
    return labels[locationType] || locationType
  }

  if (eventTypes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No event types yet</p>
          <Button asChild>
            <Link href="/dashboard/event-types/new">Create your first event type</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('grid')}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          <LayoutList className="h-4 w-4" />
        </Button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventTypes.map((eventType) => (
            <Card key={eventType.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{eventType.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {eventType.description || 'No description'}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={eventType.isActive}
                    onCheckedChange={(checked) => onToggleActive?.(eventType, checked)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{eventType.duration} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{getLocationLabel(eventType.locationType)}</span>
                  </div>
                  {eventType.price && (
                    <Badge variant="secondary">
                      {eventType.currency} {eventType.price.toString()}
                    </Badge>
                  )}
                  {eventType._count && (
                    <p className="text-xs text-muted-foreground">
                      {eventType._count.bookings} booking{eventType._count.bookings !== 1 ? 's' : ''}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit?.(eventType)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDuplicate?.(eventType)}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/${eventType.userId}/${eventType.slug}`} target="_blank">
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {eventTypes.map((eventType) => (
            <Card key={eventType.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-1 h-12 rounded"
                    style={{ backgroundColor: eventType.color || '#3b82f6' }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{eventType.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {eventType.duration}m
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {getLocationLabel(eventType.locationType)}
                      </span>
                      {eventType._count && (
                        <span>{eventType._count.bookings} bookings</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={eventType.isActive}
                    onCheckedChange={(checked) => onToggleActive?.(eventType, checked)}
                  />
                  <Button variant="outline" size="sm" onClick={() => onEdit?.(eventType)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDuplicate?.(eventType)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/${eventType.userId}/${eventType.slug}`} target="_blank">
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete?.(eventType)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
