'use client'

import { TeamWithMembers } from '@/services/team-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar, Settings, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface TeamListProps {
  teams: TeamWithMembers[]
  selectedTeam: TeamWithMembers | null
  onSelectTeam: (team: TeamWithMembers) => void
  onDeleteTeam: (teamId: string) => void
  onEditTeam: (team: TeamWithMembers) => void
}

export function TeamList({
  teams,
  selectedTeam,
  onSelectTeam,
  onDeleteTeam,
  onEditTeam,
}: TeamListProps) {
  const getUserRole = (team: TeamWithMembers, userId: string) => {
    const member = team.members.find((m) => m.userId === userId)
    return member?.role || 'MEMBER'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map((team) => (
        <Card
          key={team.id}
          className={`cursor-pointer transition-all ${
            selectedTeam?.id === team.id ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onSelectTeam(team)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {team.logoUrl ? (
                  <Avatar>
                    <AvatarImage src={team.logoUrl} alt={team.name} />
                    <AvatarFallback>{team.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <CardDescription className="text-xs">/{team.slug}</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {team._count?.members || team.members.length} members
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {team._count?.eventTypes || 0} events
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {team.members.slice(0, 3).map((member) => (
                  <Avatar key={member.id} className="h-6 w-6">
                    <AvatarImage src={member.user.avatarUrl || undefined} alt={member.user.name || member.user.username} />
                    <AvatarFallback className="text-xs">
                      {(member.user.name || member.user.username).substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {team.members.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                    +{team.members.length - 3}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditTeam(team)
                  }}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteTeam(team.id)
                  }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
