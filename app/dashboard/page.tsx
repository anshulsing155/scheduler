import { requireAuth } from '@/lib/auth/protected-route'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { DashboardClient } from './dashboard-client'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Calendar, Clock, Users, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const user = await requireAuth()

  // Fetch user data with onboarding status
  const userData = await prisma.user.findUnique({
    where: { email: user.email! },
    select: {
      id: true,
      name: true,
      email: true,
      timezone: true,
      onboardingCompleted: true,
      onboardingStep: true,
      hasSeenTour: true,
      eventTypes: {
        select: { id: true, title: true, isActive: true },
      },
      bookings: {
        where: {
          startTime: { gte: new Date() }
        },
        select: { id: true, status: true },
        orderBy: { startTime: 'asc' },
        take: 5
      },
      availability: {
        select: { id: true },
      }
    }
  })

  const stats = {
    totalEventTypes: userData?.eventTypes.length || 0,
    activeEventTypes: userData?.eventTypes.filter(et => et.isActive).length || 0,
    upcomingBookings: userData?.bookings.filter(b => b.status === 'CONFIRMED').length || 0,
    pendingBookings: userData?.bookings.filter(b => b.status === 'PENDING').length || 0,
  }

  const onboardingData = {
    onboardingCompleted: userData?.onboardingCompleted || false,
    onboardingStep: userData?.onboardingStep || 0,
    hasSeenTour: userData?.hasSeenTour || false,
    tasks: {
      profileComplete: !!(userData?.name && userData?.timezone),
      eventTypeCreated: stats.totalEventTypes > 0,
      availabilitySet: (userData?.availability.length || 0) > 0
    }
  }

  return (
    <DashboardLayout userEmail={user.email || undefined}>
      <DashboardClient user={user} onboardingData={onboardingData}>
        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back, {userData?.name || user.email}!</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Event Types</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEventTypes}</p>
                  <p className="text-sm text-gray-500 mt-1">{stats.activeEventTypes} active</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcomingBookings}</p>
                  <p className="text-sm text-gray-500 mt-1">Confirmed bookings</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingBookings}</p>
                  <p className="text-sm text-gray-500 mt-1">Awaiting confirmation</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profile</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {onboardingData.tasks.profileComplete ? '100%' : '50%'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Completion</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6" data-tour="event-types">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Event Types</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create and manage your meeting types
                  </p>
                  <Link 
                    href="/dashboard/event-types" 
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Manage Event Types →
                  </Link>
                </div>
              </div>
            </Card>

            <Card className="p-6" data-tour="bookings">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Bookings</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    View and manage your scheduled meetings
                  </p>
                  <Link 
                    href="/dashboard/bookings" 
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View Bookings →
                  </Link>
                </div>
              </div>
            </Card>

            <Card className="p-6" data-tour="profile">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Profile Settings</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage your personal information
                  </p>
                  <Link 
                    href="/dashboard/settings/profile" 
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Edit Profile →
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </DashboardClient>
    </DashboardLayout>
  )
}
