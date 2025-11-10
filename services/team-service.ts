import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { TeamRole } from '@prisma/client'

/**
 * Validation Schemas
 */

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name is too long'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug is too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  logoUrl: z.string().url('Invalid logo URL').optional(),
})

export const updateTeamSchema = createTeamSchema.partial()

export const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(TeamRole).default(TeamRole.MEMBER),
})

export const updateTeamMemberRoleSchema = z.object({
  role: z.nativeEnum(TeamRole),
})

export type CreateTeamData = z.infer<typeof createTeamSchema>
export type UpdateTeamData = z.infer<typeof updateTeamSchema>
export type InviteTeamMemberData = z.infer<typeof inviteTeamMemberSchema>
export type UpdateTeamMemberRoleData = z.infer<typeof updateTeamMemberRoleSchema>

export type TeamWithMembers = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  createdAt: Date
  updatedAt: Date
  members: {
    id: string
    userId: string
    role: TeamRole
    isAccepted: boolean
    createdAt: Date
    user: {
      id: string
      email: string
      username: string
      name: string | null
      avatarUrl: string | null
    }
  }[]
  _count?: {
    members: number
    eventTypes: number
  }
}

export type TeamMemberWithUser = {
  id: string
  teamId: string
  userId: string
  role: TeamRole
  isAccepted: boolean
  createdAt: Date
  user: {
    id: string
    email: string
    username: string
    name: string | null
    avatarUrl: string | null
  }
}

export type ServiceResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Generate a unique slug from team name
 */
export function generateTeamSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .substring(0, 50) // Limit length
}

/**
 * Ensure slug is unique
 */
async function ensureUniqueSlug(baseSlug: string, excludeTeamId?: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.team.findFirst({
      where: {
        slug,
        ...(excludeTeamId && { id: { not: excludeTeamId } }),
      },
    })

    if (!existing) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

/**
 * Client-side team service
 */
export const teamService = {
  /**
   * Create a new team
   */
  async createTeam(userId: string, data: CreateTeamData): Promise<ServiceResult<TeamWithMembers>> {
    try {
      // Validate data
      const validatedData = createTeamSchema.parse(data)

      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...validatedData, userId }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to create team',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.team,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Get all teams for a user
   */
  async getUserTeams(userId: string): Promise<ServiceResult<TeamWithMembers[]>> {
    try {
      const response = await fetch(`/api/teams?userId=${userId}`)

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to fetch teams',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.teams,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Get a single team by ID
   */
  async getTeam(teamId: string): Promise<ServiceResult<TeamWithMembers>> {
    try {
      const response = await fetch(`/api/teams/${teamId}`)

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to fetch team',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.team,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Update a team
   */
  async updateTeam(teamId: string, data: UpdateTeamData): Promise<ServiceResult<TeamWithMembers>> {
    try {
      // Validate data
      const validatedData = updateTeamSchema.parse(data)

      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to update team',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.team,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Delete a team
   */
  async deleteTeam(teamId: string): Promise<ServiceResult<void>> {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to delete team',
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Invite a team member
   */
  async inviteTeamMember(
    teamId: string,
    data: InviteTeamMemberData
  ): Promise<ServiceResult<TeamMemberWithUser>> {
    try {
      // Validate data
      const validatedData = inviteTeamMemberSchema.parse(data)

      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to invite team member',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.member,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string): Promise<ServiceResult<TeamMemberWithUser[]>> {
    try {
      const response = await fetch(`/api/teams/${teamId}/members`)

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to fetch team members',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.members,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Update team member role
   */
  async updateTeamMemberRole(
    teamId: string,
    memberId: string,
    role: TeamRole
  ): Promise<ServiceResult<TeamMemberWithUser>> {
    try {
      // Validate data
      const validatedData = updateTeamMemberRoleSchema.parse({ role })

      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to update member role',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.member,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Remove team member
   */
  async removeTeamMember(teamId: string, memberId: string): Promise<ServiceResult<void>> {
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to remove team member',
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Accept team invitation
   */
  async acceptTeamInvitation(teamId: string, userId: string): Promise<ServiceResult<TeamMemberWithUser>> {
    try {
      const response = await fetch(`/api/teams/${teamId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to accept invitation',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.member,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Decline team invitation
   */
  async declineTeamInvitation(teamId: string, userId: string): Promise<ServiceResult<void>> {
    try {
      const response = await fetch(`/api/teams/${teamId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to decline invitation',
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Check if slug is available
   */
  async checkSlugAvailability(
    slug: string,
    excludeTeamId?: string
  ): Promise<ServiceResult<{ available: boolean }>> {
    try {
      const params = new URLSearchParams({
        slug,
        ...(excludeTeamId && { excludeTeamId }),
      })

      const response = await fetch(`/api/teams/check-slug?${params}`)

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to check slug availability',
        }
      }

      return {
        success: true,
        data: { available: data.available },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },
}

/**
 * Server-side team service
 */
export const serverTeamService = {
  /**
   * Create a new team
   */
  async createTeam(userId: string, data: CreateTeamData): Promise<TeamWithMembers | null> {
    try {
      // Validate data
      const validatedData = createTeamSchema.parse(data)

      // Ensure slug is unique
      const uniqueSlug = await ensureUniqueSlug(validatedData.slug)

      // Create team with the creator as owner
      const team = await prisma.team.create({
        data: {
          name: validatedData.name,
          slug: uniqueSlug,
          logoUrl: validatedData.logoUrl,
          members: {
            create: {
              userId,
              role: TeamRole.OWNER,
              isAccepted: true, // Creator automatically accepts
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              eventTypes: true,
            },
          },
        },
      })

      return team
    } catch (error) {
      console.error('Error creating team:', error)
      return null
    }
  },

  /**
   * Get all teams for a user
   */
  async getUserTeams(userId: string): Promise<TeamWithMembers[]> {
    try {
      const teams = await prisma.team.findMany({
        where: {
          members: {
            some: {
              userId,
              isAccepted: true,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              eventTypes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return teams
    } catch (error) {
      console.error('Error fetching user teams:', error)
      return []
    }
  },

  /**
   * Get pending team invitations for a user
   */
  async getPendingInvitations(userId: string): Promise<TeamWithMembers[]> {
    try {
      const teams = await prisma.team.findMany({
        where: {
          members: {
            some: {
              userId,
              isAccepted: false,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              eventTypes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return teams
    } catch (error) {
      console.error('Error fetching pending invitations:', error)
      return []
    }
  },

  /**
   * Get a single team by ID
   */
  async getTeam(teamId: string): Promise<TeamWithMembers | null> {
    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          _count: {
            select: {
              members: true,
              eventTypes: true,
            },
          },
        },
      })

      return team
    } catch (error) {
      console.error('Error fetching team:', error)
      return null
    }
  },

  /**
   * Get team by slug
   */
  async getTeamBySlug(slug: string): Promise<TeamWithMembers | null> {
    try {
      const team = await prisma.team.findUnique({
        where: { slug },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              eventTypes: true,
            },
          },
        },
      })

      return team
    } catch (error) {
      console.error('Error fetching team by slug:', error)
      return null
    }
  },

  /**
   * Update a team
   */
  async updateTeam(teamId: string, data: UpdateTeamData): Promise<TeamWithMembers | null> {
    try {
      // Validate data
      const validatedData = updateTeamSchema.parse(data)

      // If slug is being updated, ensure it's unique
      if (validatedData.slug) {
        validatedData.slug = await ensureUniqueSlug(validatedData.slug, teamId)
      }

      const team = await prisma.team.update({
        where: { id: teamId },
        data: validatedData,
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              eventTypes: true,
            },
          },
        },
      })

      return team
    } catch (error) {
      console.error('Error updating team:', error)
      return null
    }
  },

  /**
   * Delete a team
   */
  async deleteTeam(teamId: string): Promise<boolean> {
    try {
      await prisma.team.delete({
        where: { id: teamId },
      })

      return true
    } catch (error) {
      console.error('Error deleting team:', error)
      return false
    }
  },

  /**
   * Invite a team member
   */
  async inviteTeamMember(
    teamId: string,
    email: string,
    role: TeamRole = TeamRole.MEMBER
  ): Promise<TeamMemberWithUser | null> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        throw new Error('User not found with this email')
      }

      // Check if user is already a member
      const existingMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: user.id,
          },
        },
      })

      if (existingMember) {
        throw new Error('User is already a member of this team')
      }

      // Create team member invitation
      const member = await prisma.teamMember.create({
        data: {
          teamId,
          userId: user.id,
          role,
          isAccepted: false, // Requires acceptance
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      })

      // TODO: Send invitation email to user

      return member
    } catch (error) {
      console.error('Error inviting team member:', error)
      return null
    }
  },

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string, includeUnaccepted = false): Promise<TeamMemberWithUser[]> {
    try {
      const members = await prisma.teamMember.findMany({
        where: {
          teamId,
          ...(includeUnaccepted ? {} : { isAccepted: true }),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

      return members
    } catch (error) {
      console.error('Error fetching team members:', error)
      return []
    }
  },

  /**
   * Update team member role
   */
  async updateTeamMemberRole(memberId: string, role: TeamRole): Promise<TeamMemberWithUser | null> {
    try {
      const member = await prisma.teamMember.update({
        where: { id: memberId },
        data: { role },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      })

      return member
    } catch (error) {
      console.error('Error updating team member role:', error)
      return null
    }
  },

  /**
   * Remove team member
   */
  async removeTeamMember(memberId: string): Promise<boolean> {
    try {
      await prisma.teamMember.delete({
        where: { id: memberId },
      })

      return true
    } catch (error) {
      console.error('Error removing team member:', error)
      return false
    }
  },

  /**
   * Accept team invitation
   */
  async acceptTeamInvitation(teamId: string, userId: string): Promise<TeamMemberWithUser | null> {
    try {
      const member = await prisma.teamMember.update({
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
        data: {
          isAccepted: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      })

      return member
    } catch (error) {
      console.error('Error accepting team invitation:', error)
      return null
    }
  },

  /**
   * Decline team invitation
   */
  async declineTeamInvitation(teamId: string, userId: string): Promise<boolean> {
    try {
      await prisma.teamMember.delete({
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
      })

      return true
    } catch (error) {
      console.error('Error declining team invitation:', error)
      return false
    }
  },

  /**
   * Check if user is team member
   */
  async isTeamMember(teamId: string, userId: string): Promise<boolean> {
    try {
      const member = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
      })

      return member !== null && member.isAccepted
    } catch (error) {
      console.error('Error checking team membership:', error)
      return false
    }
  },

  /**
   * Check if user has admin or owner role
   */
  async isTeamAdmin(teamId: string, userId: string): Promise<boolean> {
    try {
      const member = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
      })

      return member !== null && member.isAccepted && (member.role === TeamRole.ADMIN || member.role === TeamRole.OWNER)
    } catch (error) {
      console.error('Error checking team admin status:', error)
      return false
    }
  },

  /**
   * Check if user is team owner
   */
  async isTeamOwner(teamId: string, userId: string): Promise<boolean> {
    try {
      const member = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
      })

      return member !== null && member.isAccepted && member.role === TeamRole.OWNER
    } catch (error) {
      console.error('Error checking team owner status:', error)
      return false
    }
  },

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string, excludeTeamId?: string): Promise<boolean> {
    try {
      const team = await prisma.team.findFirst({
        where: {
          slug,
          ...(excludeTeamId && { id: { not: excludeTeamId } }),
        },
      })

      return !team
    } catch (error) {
      console.error('Error checking slug availability:', error)
      return false
    }
  },
}

/**
 * Team Availability Service
 * Handles collective and round-robin scheduling logic
 */

import { addMinutes, startOfDay, endOfDay } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { serverAvailabilityService, TimeSlot } from './availability-service'

export type TeamAvailabilityMode = 'COLLECTIVE' | 'ROUND_ROBIN'

export type TeamMemberAvailability = {
  userId: string
  userName: string
  availableSlots: TimeSlot[]
}

export type TeamAvailabilityResult = {
  availableSlots: TimeSlot[]
  memberAvailability?: TeamMemberAvailability[]
}

/**
 * Server-side team availability service
 */
export const serverTeamAvailabilityService = {
  /**
   * Get team availability for a specific date
   * Supports both collective (all members must be available) and round-robin modes
   */
  async getTeamAvailability(
    teamId: string,
    date: Date,
    duration: number,
    timezone: string,
    mode: TeamAvailabilityMode = 'COLLECTIVE',
    eventTypeId?: string
  ): Promise<TeamAvailabilityResult> {
    try {
      // Get all accepted team members
      const members = await serverTeamService.getTeamMembers(teamId, false)

      if (members.length === 0) {
        return { availableSlots: [] }
      }

      // Get availability for each team member
      const memberAvailabilities: TeamMemberAvailability[] = []

      for (const member of members) {
        const slots = await serverAvailabilityService.getAvailableSlots(
          member.userId,
          date,
          duration,
          timezone,
          eventTypeId
        )

        memberAvailabilities.push({
          userId: member.userId,
          userName: member.user.name || member.user.username,
          availableSlots: slots,
        })
      }

      let availableSlots: TimeSlot[] = []

      if (mode === 'COLLECTIVE') {
        // Collective: Find slots where ALL members are available
        availableSlots = this.calculateCollectiveAvailability(memberAvailabilities)
      } else {
        // Round-robin: Find slots where AT LEAST ONE member is available
        availableSlots = this.calculateRoundRobinAvailability(memberAvailabilities)
      }

      return {
        availableSlots,
        memberAvailability: memberAvailabilities,
      }
    } catch (error) {
      console.error('Error getting team availability:', error)
      return { availableSlots: [] }
    }
  },

  /**
   * Calculate collective availability (all members must be available)
   */
  calculateCollectiveAvailability(memberAvailabilities: TeamMemberAvailability[]): TimeSlot[] {
    if (memberAvailabilities.length === 0) {
      return []
    }

    // Start with the first member's slots
    let commonSlots = [...memberAvailabilities[0].availableSlots]

    // Find intersection with each subsequent member's slots
    for (let i = 1; i < memberAvailabilities.length; i++) {
      const memberSlots = memberAvailabilities[i].availableSlots

      commonSlots = commonSlots.filter((slot) =>
        memberSlots.some(
          (memberSlot) =>
            memberSlot.startTime === slot.startTime && memberSlot.endTime === slot.endTime
        )
      )
    }

    return commonSlots
  },

  /**
   * Calculate round-robin availability (at least one member available)
   */
  calculateRoundRobinAvailability(memberAvailabilities: TeamMemberAvailability[]): TimeSlot[] {
    if (memberAvailabilities.length === 0) {
      return []
    }

    // Collect all unique time slots
    const allSlotsMap = new Map<string, TimeSlot>()

    memberAvailabilities.forEach((member) => {
      member.availableSlots.forEach((slot) => {
        const key = `${slot.startTime}-${slot.endTime}`
        if (!allSlotsMap.has(key)) {
          allSlotsMap.set(key, slot)
        }
      })
    })

    // Convert map to array and sort by start time
    return Array.from(allSlotsMap.values()).sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    )
  },

  /**
   * Assign a team member for round-robin booking
   * Uses load balancing to distribute bookings evenly
   */
  async assignRoundRobinMember(
    teamId: string,
    startTime: Date,
    duration: number,
    eventTypeId?: string
  ): Promise<string | null> {
    try {
      // Get all accepted team members
      const members = await serverTeamService.getTeamMembers(teamId, false)

      if (members.length === 0) {
        return null
      }

      // Get booking counts for each member in the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const memberBookingCounts = await Promise.all(
        members.map(async (member) => {
          const bookingCount = await prisma.booking.count({
            where: {
              userId: member.userId,
              ...(eventTypeId && { eventTypeId }),
              createdAt: {
                gte: thirtyDaysAgo,
              },
              status: {
                in: ['PENDING', 'CONFIRMED', 'COMPLETED'],
              },
            },
          })

          return {
            userId: member.userId,
            bookingCount,
          }
        })
      )

      // Check which members are available for the requested time slot
      const availableMembers = []

      for (const member of members) {
        const isAvailable = await serverAvailabilityService.checkSlotAvailability(
          member.userId,
          startTime,
          duration
        )

        if (isAvailable) {
          const bookingData = memberBookingCounts.find((m) => m.userId === member.userId)
          availableMembers.push({
            userId: member.userId,
            bookingCount: bookingData?.bookingCount || 0,
          })
        }
      }

      if (availableMembers.length === 0) {
        return null
      }

      // Sort by booking count (ascending) to assign to member with fewest bookings
      availableMembers.sort((a, b) => a.bookingCount - b.bookingCount)

      // Return the member with the fewest bookings
      return availableMembers[0].userId
    } catch (error) {
      console.error('Error assigning round-robin member:', error)
      return null
    }
  },

  /**
   * Get team member load distribution
   * Returns booking counts for each team member
   */
  async getTeamMemberLoadDistribution(
    teamId: string,
    startDate: Date,
    endDate: Date,
    eventTypeId?: string
  ): Promise<{ userId: string; userName: string; bookingCount: number }[]> {
    try {
      const members = await serverTeamService.getTeamMembers(teamId, false)

      const loadDistribution = await Promise.all(
        members.map(async (member) => {
          const bookingCount = await prisma.booking.count({
            where: {
              userId: member.userId,
              ...(eventTypeId && { eventTypeId }),
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
              status: {
                in: ['PENDING', 'CONFIRMED', 'COMPLETED'],
              },
            },
          })

          return {
            userId: member.userId,
            userName: member.user.name || member.user.username,
            bookingCount,
          }
        })
      )

      return loadDistribution.sort((a, b) => b.bookingCount - a.bookingCount)
    } catch (error) {
      console.error('Error getting team member load distribution:', error)
      return []
    }
  },

  /**
   * Cache team availability for performance
   * Returns a cache key for storing/retrieving team availability
   */
  generateTeamAvailabilityCacheKey(
    teamId: string,
    date: Date,
    duration: number,
    timezone: string,
    mode: TeamAvailabilityMode
  ): string {
    const dateStr = date.toISOString().split('T')[0]
    return `team:${teamId}:availability:${dateStr}:${duration}:${timezone}:${mode}`
  },

  /**
   * Get available members for a specific time slot
   * Useful for showing which team members can take a booking
   */
  async getAvailableMembersForSlot(
    teamId: string,
    startTime: Date,
    duration: number
  ): Promise<{ userId: string; userName: string; avatarUrl: string | null }[]> {
    try {
      const members = await serverTeamService.getTeamMembers(teamId, false)

      const availableMembers = []

      for (const member of members) {
        const isAvailable = await serverAvailabilityService.checkSlotAvailability(
          member.userId,
          startTime,
          duration
        )

        if (isAvailable) {
          availableMembers.push({
            userId: member.userId,
            userName: member.user.name || member.user.username,
            avatarUrl: member.user.avatarUrl,
          })
        }
      }

      return availableMembers
    } catch (error) {
      console.error('Error getting available members for slot:', error)
      return []
    }
  },

  /**
   * Validate team availability before booking
   * Ensures at least one member is available for the requested time
   */
  async validateTeamAvailability(
    teamId: string,
    startTime: Date,
    duration: number,
    mode: TeamAvailabilityMode
  ): Promise<{ valid: boolean; assignedUserId?: string }> {
    try {
      const members = await serverTeamService.getTeamMembers(teamId, false)

      if (members.length === 0) {
        return { valid: false }
      }

      if (mode === 'COLLECTIVE') {
        // Check if ALL members are available
        const availabilityChecks = await Promise.all(
          members.map((member) =>
            serverAvailabilityService.checkSlotAvailability(member.userId, startTime, duration)
          )
        )

        const allAvailable = availabilityChecks.every((available) => available)

        return { valid: allAvailable }
      } else {
        // Round-robin: assign to available member with fewest bookings
        const assignedUserId = await this.assignRoundRobinMember(teamId, startTime, duration)

        return {
          valid: assignedUserId !== null,
          assignedUserId: assignedUserId || undefined,
        }
      }
    } catch (error) {
      console.error('Error validating team availability:', error)
      return { valid: false }
    }
  },
}
