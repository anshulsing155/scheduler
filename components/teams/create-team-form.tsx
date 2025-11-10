'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { teamService, generateTeamSlug } from '@/services/team-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

interface CreateTeamFormProps {
  userId: string
}

export function CreateTeamForm({ userId }: CreateTeamFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugTouched) {
      setSlug(generateTeamSlug(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setSlugTouched(true)
    setSlug(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await teamService.createTeam(userId, { name, slug })

      if (result.success && result.data) {
        toast({
          title: 'Success',
          description: 'Team created successfully',
        })
        router.push(`/dashboard/teams/${result.data.id}`)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create team',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Team Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Engineering Team"
          required
          disabled={loading}
        />
        <p className="text-sm text-muted-foreground">
          The name of your team as it will appear to members
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Team URL Slug</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            /team/
          </span>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="engineering-team"
            required
            disabled={loading}
            pattern="[a-z0-9-]+"
            title="Only lowercase letters, numbers, and hyphens are allowed"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          A unique identifier for your team's URL
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !name || !slug}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Team
        </Button>
      </div>
    </form>
  )
}
