'use client'

import { useState, useEffect } from 'react'
import { TeamWithMembers } from '@/services/team-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'

interface RoundRobinSettingsProps {
  team: TeamWithMembers
  selectedMembers?: string[]
  onSelectedMembersChange?: (memberIds: string[]) => void
}

export function RoundRobinSettings({
  team,
  selectedMembers = [],
  onSelectedMembersChange,
}: RoundRobinSettingsProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedMembers.length > 0 ? selectedMembers : team.members.map((m) => m.userId))
  )

  useEffect(() => {
    if (onSelectedMembersChange) {
      onSelectedMembersChange(Array.from(selected))
    }
  }, [selected, onSelectedMembersChange])

  const toggleMember = (userId: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelected(newSelected)
  }

  const acceptedMembers = team.members.filter((m) => m.isAccepted)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Round Robin Configuration</CardTitle>
        <CardDescription>
          Select which team members should be included in the round robin rotation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
          <p className="text-sm text-blue-900 dark:text-blue-100">
            Bookings will be distributed evenly among selected members based on their availability
            and current booking load.
          </p>
        </div>

        <div className="space-y-2">
          {acceptedMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
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
                <div>
                  <p className="font-medium text-sm">
                    {member.user.name || member.user.username}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                </div>
                {member.role === 'OWNER' && (
                  <Badge variant="secondary" className="text-xs">
                    Owner
                  </Badge>
                )}
              </div>
              <Switch
                checked={selected.has(member.userId)}
                onCheckedChange={() => toggleMember(member.userId)}
              />
            </div>
          ))}
        </div>

        {selected.size === 0 && (
          <p className="text-sm text-destructive">
            At least one team member must be selected
          </p>
        )}

        <div className="text-sm text-muted-foreground">
          {selected.size} of {acceptedMembers.length} members selected
        </div>
      </CardContent>
    </Card>
  )
}
