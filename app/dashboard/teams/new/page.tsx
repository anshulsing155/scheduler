import { requireAuth } from '@/lib/auth/protected-route'
import { CreateTeamForm } from '@/components/teams/create-team-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function NewTeamPage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/dashboard/teams">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teams
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Team</CardTitle>
            <CardDescription>
              Set up a new team to collaborate on scheduling and manage team events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTeamForm userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
