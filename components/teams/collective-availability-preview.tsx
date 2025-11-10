'use client'

import { useState, useEffect } from 'react'
import { TeamWithMembers, serverTeamAvailabilityService } from '@/services/team-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { format, addDays } from 'date-fns'

interface CollectiveAvailabilityPreviewProps {
  team: TeamWithMembers
  duration: number
}

export function CollectiveAvailabilityPreview({
  team,
  duration,
}: CollectiveAvailabilityPreviewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [memberAvailability, setMemberAvailability] = useState<any[]>([])

  useEffect(() => {
    loadAvailability()
  }, [selectedDate, duration, team.id])

  const loadAvailability = async () => {
    setLoading(true)
    try {
      // This would normally call an API endpoint
      // For now, we'll show a placeholder
      setAvailableSlots([])
      setMemberAvailability([])
    } catch (error) {
      console.error('Error loading availability:', error)
    }
    setLoading(false)
  }

  const nextWeekDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Collective Availability Preview</CardTitle>
        <CardDescription>
          View when all team members are available
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {nextWeekDays.map((date) => (
            <Button
              key={date.toISOString()}
              variant={
                format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                  ? 'default'
                  : 'outline'
              }
              size="sm"
              onClick={() => setSelectedDate(date)}
              className="flex-shrink-0"
            >
              <div className="text-center">
                <div className="text-xs">{format(date, 'EEE')}</div>
                <div className="font-semibold">{format(date, 'd')}</div>
              </div>
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading availability...
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">
                Available Slots for {format(selectedDate, 'MMMM d, yyyy')}
              </h4>
              {availableSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No common availability found for all team members on this date.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.map((slot, index) => (
                    <Button key={index} variant="outline" size="sm">
                      {format(new Date(slot.startTime), 'h:mm a')}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2">Member Availability</h4>
              <div className="space-y-2">
                {team.members
                  .filter((m) => m.isAccepted)
                  .map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span className="text-sm">
                        {member.user.name || member.user.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {/* This would show actual slot count */}
                        Loading...
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <Calendar className="h-4 w-4 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Collective scheduling requires all selected team members to be available at the
                same time. Guests will only see time slots when everyone is free.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
