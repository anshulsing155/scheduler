import { requireAuth } from '@/lib/auth/protected-route'
import { TeamManagement } from '@/components/teams/team-management'

export default async function TeamsPage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeamManagement userId={user.id} />
      </div>
    </div>
  )
}
