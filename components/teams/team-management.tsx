'use client'

import { useState, useEffect } from 'react'
import { TeamWithMembers, teamService } from '@/services/team-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Plus, Settings } from 'lucide-react'
import { TeamList } from './team-list'
import { TeamMemberList } from './team-member-list'
import { CreateTeamDialog } from './create-team-dialog'
import { TeamSettingsDialog } from './team-settings-dialog'
import { InviteMemberDialog } from './invite-member-dialog'
import { useToast } from '@/components/ui/use-toast'

interface TeamManagementProps {
  userId: string
}

export function TeamManagement({ userId }: TeamManagementProps) {
  const [teams, setTeams] = useState<TeamWithMembers[]>([])
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null)
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadTeams()
  }, [userId])

  const loadTeams = async () => {
    setLoading(true)
    const result = await teamService.getUserTeams(userId)
    if (result.success && result.data) {
      setTeams(result.data)
      if (result.data.length > 0 && !selectedTeam) {
        setSelectedTeam(result.data[0])
      }
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to load teams',
        variant: 'destructive',
      })
    }
    setLoading(false)
  }

  const handleCreateTeam = async (name: string, slug: string) => {
    const result = await teamService.createTeam(userId, { name, slug })
    if (result.success && result.data) {
      toast({
        title: 'Success',
        description: 'Team created successfully',
      })
      await loadTeams()
      setSelectedTeam(result.data)
      setCreateDialogOpen(false)
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to create team',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateTeam = async (teamId: string, data: { name?: string; slug?: string; logoUrl?: string }) => {
    const result = await teamService.updateTeam(teamId, data)
    if (result.success && result.data) {
      toast({
        title: 'Success',
        description: 'Team updated successfully',
      })
      await loadTeams()
      setSelectedTeam(result.data)
      setSettingsDialogOpen(false)
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update team',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return
    }

    const result = await teamService.deleteTeam(teamId)
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Team deleted successfully',
      })
      await loadTeams()
      setSelectedTeam(null)
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete team',
        variant: 'destructive',
      })
    }
  }

  const handleInviteMember = async (email: string, role: any) => {
    if (!selectedTeam) return

    const result = await teamService.inviteTeamMember(selectedTeam.id, { email, role })
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Team member invited successfully',
      })
      await loadTeams()
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
    if (!selectedTeam) return

    if (!confirm('Are you sure you want to remove this team member?')) {
      return
    }

    const result = await teamService.removeTeamMember(selectedTeam.id, memberId)
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Team member removed successfully',
      })
      await loadTeams()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to remove team member',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateMemberRole = async (memberId: string, role: any) => {
    if (!selectedTeam) return

    const result = await teamService.updateTeamMemberRole(selectedTeam.id, memberId, role)
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Member role updated successfully',
      })
      await loadTeams()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update member role',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading teams...</p>
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No teams yet</p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first team
          </Button>
        </CardContent>
        <CreateTeamDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreateTeam={handleCreateTeam}
        />
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Team Management</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      <Tabs defaultValue="teams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teams">My Teams</TabsTrigger>
          {selectedTeam && <TabsTrigger value="members">Team Members</TabsTrigger>}
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          <TeamList
            teams={teams}
            selectedTeam={selectedTeam}
            onSelectTeam={setSelectedTeam}
            onDeleteTeam={handleDeleteTeam}
            onEditTeam={(team) => {
              setSelectedTeam(team)
              setSettingsDialogOpen(true)
            }}
          />
        </TabsContent>

        {selectedTeam && (
          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedTeam.name} Members</CardTitle>
                    <CardDescription>
                      Manage team members and their roles
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSettingsDialogOpen(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TeamMemberList
                  members={selectedTeam.members.map(m => ({ ...m, teamId: selectedTeam.id }))}
                  currentUserId={userId}
                  onRemoveMember={handleRemoveMember}
                  onUpdateRole={handleUpdateMemberRole}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <CreateTeamDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateTeam={handleCreateTeam}
      />

      {selectedTeam && (
        <>
          <TeamSettingsDialog
            open={settingsDialogOpen}
            onOpenChange={setSettingsDialogOpen}
            team={selectedTeam}
            onUpdateTeam={handleUpdateTeam}
          />
          <InviteMemberDialog
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            onInviteMember={handleInviteMember}
          />
        </>
      )}
    </div>
  )
}
