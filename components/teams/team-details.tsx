'use client'

import { useState } from 'react'
import { TeamWithMembers, teamService } from '@/services/team-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Plus, ArrowLeft, Users, Calendar } from 'lucide-react'
import Link from 'next/link'
import { TeamMemberList } from './team-member-list'
import { InviteMemberDialog } from './invite-member-dialog'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface TeamDetailsProps {
  team: TeamWithMembers
  userId: string
}

export function TeamDetails({ team: initialTeam, userId }: TeamDetailsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [team, setTeam] = useState(initialTeam)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  const currentMember = team.members.find((m) => m.userId === userId)
  const isAdmin = currentMember?.role === 'ADMIN' || currentMember?.role === 'OWNER'

  const handleInviteMember = async (email: string, role: any) => {
    const result = await teamService.inviteTeamMember(team.id, { email, role })
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Team member invited successfully',
      })
      // Refresh team data
      const teamResult = await teamService.getTeam(team.id)
      if (teamResult.success && teamResult.data) {
        setTeam(teamResult.data)
      }
      setInviteDialogOpen(false)
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to invite team member',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return
    }

    const result = await teamService.removeTeamMember(team.id, memberId)
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Team member removed successfully',
      })
      // Refresh team data
      const teamResult = await teamService.getTeam(team.id)
      if (teamResult.success && teamResult.data) {
        setTeam(teamResult.data)
      }
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to remove team member',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateMemberRole = async (memberId: string, role: any) => {
    const result = await teamService.updateTeamMemberRole(team.id, memberId, role)
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Member role updated successfully',
      })
      // Refresh team data
      const teamResult = await teamService.getTeam(team.id)
      if (teamResult.success && teamResult.data) {
        setTeam(teamResult.data)
      }
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update member role',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/teams">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{team.name}</h1>
            <p className="text-muted-foreground">
              {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>
        {isAdmin && (
          <Link href={`/dashboard/teams/${team.id}/settings`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="events">
            <Calendar className="h-4 w-4 mr-2" />
            Team Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage team members and their roles
                  </CardDescription>
                </div>
                {isAdmin && (
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <TeamMemberList
                members={team.members.map((m) => ({ ...m, teamId: team.id }))}
                currentUserId={userId}
                onRemoveMember={handleRemoveMember}
                onUpdateRole={handleUpdateMemberRole}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No team events yet</p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Create team event types to allow scheduling with multiple team members
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInviteMember={handleInviteMember}
      />
    </div>
  )
}
