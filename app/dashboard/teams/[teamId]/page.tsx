import { requireAuth } from '@/lib/auth/protected-route'
import { serverTeamService } from '@/services/team-service'
import { notFound, redirect } from 'next/navigation'
import { TeamDetails } from '@/components/teams/team-details'

interface TeamPageProps {
  params: {
    teamId: string
  }
}

export default async function TeamPage({ params }: TeamPageProps) {
  const user = await requireAuth()
  const { teamId } = params

  // Check if user is a member of the team
  const isMember = await serverTeamService.isTeamMember(teamId, user.id)
  
  if (!isMember) {
    redirect('/dashboard/teams')
  }

  // Get team details
  const team = await serverTeamService.getTeam(teamId)

  if (!team) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeamDetails team={team} userId={user.id} />
      </div>
    </div>
  )
}
