import { requireAuth } from '@/lib/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { TeamManagement } from '@/components/teams/team-management'

export default async function TeamsPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout userEmail={user.email || undefined}>
      <div className="p-6 lg:p-8">
        <TeamManagement userId={user.id} />
      </div>
    </DashboardLayout>
  )
}
