import { requireAuth } from '@/lib/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Plus } from 'lucide-react'

export default async function AvailabilityPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout userEmail={user.email || undefined}>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Availability</h1>
          <p className="text-gray-600 mt-1">
            Set your weekly schedule and date-specific overrides
          </p>
        </div>

        <Card className="p-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Availability Management</h3>
          <p className="text-gray-600 mb-6">
            This feature is coming soon. You'll be able to set your weekly availability hours and date-specific overrides.
          </p>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Availability
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  )
}
