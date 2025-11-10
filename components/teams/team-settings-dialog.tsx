'use client'

import { useState, useEffect } from 'react'
import { TeamWithMembers } from '@/services/team-service'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TeamSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: TeamWithMembers
  onUpdateTeam: (teamId: string, data: { name?: string; slug?: string; logoUrl?: string }) => void
}

export function TeamSettingsDialog({
  open,
  onOpenChange,
  team,
  onUpdateTeam,
}: TeamSettingsDialogProps) {
  const [name, setName] = useState(team.name)
  const [slug, setSlug] = useState(team.slug)
  const [logoUrl, setLogoUrl] = useState(team.logoUrl || '')

  useEffect(() => {
    setName(team.name)
    setSlug(team.slug)
    setLogoUrl(team.logoUrl || '')
  }, [team])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateTeam(team.id, {
      name,
      slug,
      logoUrl: logoUrl || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Team Settings</DialogTitle>
            <DialogDescription>
              Update your team information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                placeholder="Engineering Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Team URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/</span>
                <Input
                  id="slug"
                  placeholder="engineering-team"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  pattern="[a-z0-9-]+"
                  title="Only lowercase letters, numbers, and hyphens"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Only lowercase letters, numbers, and hyphens
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL (optional)</Label>
              <Input
                id="logoUrl"
                type="url"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name || !slug}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
