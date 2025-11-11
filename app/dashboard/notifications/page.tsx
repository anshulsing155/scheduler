import { requireAuth } from '@/lib/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import NotificationSettingsClient from './notification-settings-client'

export default async function NotificationSettingsPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout userEmail={user.email || undefined}>
      <div className="p-6 lg:p-8">
        <NotificationSettingsClient userId={user.id} />
      </div>
    </DashboardLayout>
  )
}
