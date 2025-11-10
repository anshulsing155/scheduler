import { requireAuth } from '@/lib/auth/protected-route'
import { serverTeamService } from '@/services/team-service'
import { notFound, redirect } from 'next/navigation'
import { TeamSettingsForm } from '@/components/teams/team-settings-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface TeamSettingsPageProps {
  params: {
    teamId: string
  }
}

export default async function TeamSettingsPage({ params }: TeamSettingsPageProps) {
  const user = await requireAuth()
  const { teamId } = params

  // Check if user is admin or owner
  const isAdmin = await serverTeamService.isTeamAdmin(teamId, user.id)
  
  if (!isAdmin) {
    redirect(`/dashboard/teams/${teamId}`)
  }

  // Get team details
  const team = await serverTeamService.getTeam(teamId)

  if (!team) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href={`/dashboard/teams/${teamId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Team
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Settings</CardTitle>
            <CardDescription>
              Manage your team's information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamSettingsForm team={team} userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
