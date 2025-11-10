'use client'

import { useState } from 'react'
import { TeamWithMembers } from '@/services/team-service'
import { SchedulingType } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { RoundRobinSettings } from './round-robin-settings'
import { CollectiveAvailabilityPreview } from './collective-availability-preview'
import { DurationSelector } from '@/components/event-types/duration-selector'
import { LocationSettings } from '@/components/event-types/location-settings'

interface TeamEventFormProps {
  team: TeamWithMembers
  onSubmit: (data: any) => void
  initialData?: any
}

export function TeamEventForm({ team, onSubmit, initialData }: TeamEventFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [duration, setDuration] = useState(initialData?.duration || 30)
  const [schedulingType, setSchedulingType] = useState<SchedulingType>(
    initialData?.schedulingType || SchedulingType.COLLECTIVE
  )
  const [locationType, setLocationType] = useState(initialData?.locationType || 'VIDEO_ZOOM')
  const [locationDetails, setLocationDetails] = useState(initialData?.locationDetails || '')
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true)
  const [showPreview, setShowPreview] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      description,
      duration,
      schedulingType,
      locationType,
      locationDetails,
      isActive,
      teamId: team.id,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Configure the basic details of your team event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              placeholder="Team Consultation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this meeting is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <DurationSelector value={duration} onChange={setDuration} />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <LocationSettings
              locationType={locationType}
              locationDetails={locationDetails}
              onLocationTypeChange={setLocationType}
              onLocationDetailsChange={setLocationDetails}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active</Label>
              <p className="text-sm text-muted-foreground">
                Make this event type available for booking
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Scheduling</CardTitle>
          <CardDescription>
            Choose how team members are assigned to bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schedulingType">Scheduling Type</Label>
            <Select
              value={schedulingType}
              onValueChange={(value) => setSchedulingType(value as SchedulingType)}
            >
              <SelectTrigger id="schedulingType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COLLECTIVE">
                  <div>
                    <p className="font-medium">Collective</p>
                    <p className="text-xs text-muted-foreground">
                      All team members must be available
                    </p>
                  </div>
                </SelectItem>
                <SelectItem value="ROUND_ROBIN">
                  <div>
                    <p className="font-medium">Round Robin</p>
                    <p className="text-xs text-muted-foreground">
                      Distribute bookings evenly among available members
                    </p>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {schedulingType === SchedulingType.ROUND_ROBIN && (
            <RoundRobinSettings team={team} />
          )}

          {schedulingType === SchedulingType.COLLECTIVE && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide' : 'Show'} Availability Preview
              </Button>
              {showPreview && (
                <CollectiveAvailabilityPreview team={team} duration={duration} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update' : 'Create'} Team Event
        </Button>
      </div>
    </form>
  )
}
