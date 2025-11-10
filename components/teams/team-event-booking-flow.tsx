'use client'

import { useState, useEffect } from 'react'
import { TeamWithMembers } from '@/services/team-service'
import { EventTypeWithRelations } from '@/services/event-type-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface TeamEventBookingFlowProps {
  eventType: EventTypeWithRelations
  team: TeamWithMembers
  onSelectSlot: (slot: any) => void
}

export function TeamEventBookingFlow({
  eventType,
  team,
  onSelectSlot,
}: TeamEventBookingFlowProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [assignedMembers, setAssignedMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const isCollective = eventType.schedulingType === 'COLLECTIVE'
  const isRoundRobin = eventType.schedulingType === 'ROUND_ROBIN'

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots()
    }
  }, [selectedDate])

  const loadAvailableSlots = async () => {
    setLoading(true)
    try {
      // This would call the API to get team availability
      // For now, placeholder
      setAvailableSlots([])
    } catch (error) {
      console.error('Error loading slots:', error)
    }
    setLoading(false)
  }

  const handleSlotSelect = async (slot: any) => {
    if (isRoundRobin) {
      // For round-robin, we need to determine which member will be assigned
      // This would call the API to assign a member
      onSelectSlot({ ...slot, assignedMemberId: null })
    } else {
      // For collective, all members are assigned
      onSelectSlot({ ...slot, teamId: team.id })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{eventType.title}</CardTitle>
              <CardDescription className="mt-2">
                {eventType.description}
              </CardDescription>
            </div>
            <Badge variant={isCollective ? 'default' : 'secondary'}>
              {isCollective ? 'Collective' : 'Round Robin'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {eventType.duration} minutes
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {team.name}
            </span>
          </div>

          <div>
            <h4 className="font-medium mb-2">Team Members</h4>
            <div className="flex flex-wrap gap-2">
              {team.members
                .filter((m) => m.isAccepted)
                .map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 p-2 border rounded-lg"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={member.user.avatarUrl || undefined}
                        alt={member.user.name || member.user.username}
                      />
                      <AvatarFallback className="text-xs">
                        {(member.user.name || member.user.username)
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {member.user.name || member.user.username}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {isCollective && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                All team members will attend this meeting
              </p>
            </div>
          )}

          {isRoundRobin && (
            <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <p className="text-sm text-purple-900 dark:text-purple-100">
                One available team member will be assigned to your meeting
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select a Time</CardTitle>
          <CardDescription>
            Choose a date and time that works for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Calendar and time slot picker would go here */}
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a date to view available times</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
