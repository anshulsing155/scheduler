import { requireAuth } from '@/lib/auth/protected-route'
import { signOut } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.email}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-2">Profile Settings</h2>
            <p className="text-gray-600 mb-4">
              Manage your personal information and preferences
            </p>
            <Link href="/dashboard/settings/profile">
              <Button>Edit Profile</Button>
            </Link>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-2">Event Types</h2>
            <p className="text-gray-600 mb-4">
              Create and manage your meeting types
            </p>
            <Button disabled>Coming Soon</Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-2">Bookings</h2>
            <p className="text-gray-600 mb-4">
              View and manage your scheduled meetings
            </p>
            <Button disabled>Coming Soon</Button>
          </Card>
        </div>

        <div className="mt-8">
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
