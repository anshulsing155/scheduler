import { requireAuth } from '@/lib/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export default async function AnalyticsPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout userEmail={user.email || undefined}>
      <div className="p-6 lg:p-8">
        <AnalyticsDashboard userId={user.id} />
      </div>
    </DashboardLayout>
  )
}
