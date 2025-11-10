'use client'

import { TeamMemberWithUser } from '@/services/team-service'
import { TeamRole } from '@prisma/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Mail, CheckCircle, Clock } from 'lucide-react'

interface TeamMemberListProps {
  members: TeamMemberWithUser[]
  currentUserId: string
  onRemoveMember: (memberId: string) => void
  onUpdateRole: (memberId: string, role: TeamRole) => void
}

export function TeamMemberList({
  members,
  currentUserId,
  onRemoveMember,
  onUpdateRole,
}: TeamMemberListProps) {
  const getRoleBadgeVariant = (role: TeamRole) => {
    switch (role) {
      case 'OWNER':
        return 'default'
      case 'ADMIN':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getRoleLabel = (role: TeamRole) => {
    switch (role) {
      case 'OWNER':
        return 'Owner'
      case 'ADMIN':
        return 'Admin'
      default:
        return 'Member'
    }
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No team members yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const isCurrentUser = member.userId === currentUserId
        const isOwner = member.role === 'OWNER'

        return (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage
                  src={member.user.avatarUrl || undefined}
                  alt={member.user.name || member.user.username}
                />
                <AvatarFallback>
                  {(member.user.name || member.user.username)
                    .substring(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {member.user.name || member.user.username}
                    {isCurrentUser && (
                      <span className="text-muted-foreground ml-2">(You)</span>
                    )}
                  </p>
                  {!member.isAccepted && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                  {member.isAccepted && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{member.user.email}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwner ? (
                <Badge variant={getRoleBadgeVariant(member.role)}>
                  {getRoleLabel(member.role)}
                </Badge>
              ) : (
                <Select
                  value={member.role}
                  onValueChange={(value) => onUpdateRole(member.id, value as TeamRole)}
                  disabled={isCurrentUser}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="OWNER">Owner</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {!isOwner && !isCurrentUser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveMember(member.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
