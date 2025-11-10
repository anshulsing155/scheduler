# Team Scheduling Components

This directory contains all components related to team scheduling functionality, enabling multiple users to collaborate on scheduling and manage team events.

## Components

### Core Management

#### `TeamManagement`
Main container component for team management interface.
- Displays list of user's teams
- Manages team creation, editing, and deletion
- Handles team member invitations and role management
- Provides tabbed interface for teams and members

#### `TeamList`
Displays a grid of team cards with key information.
- Shows team name, slug, member count, and event count
- Displays member avatars
- Provides quick access to team settings and deletion

#### `TeamMemberList`
Lists all members of a team with role management.
- Shows member details (name, email, avatar)
- Displays member role with ability to update (for admins/owners)
- Shows invitation status (pending/accepted)
- Allows removing members (except owners)

### Dialogs

#### `CreateTeamDialog`
Modal for creating a new team.
- Team name input
- Auto-generated slug (editable)
- Slug validation

#### `TeamSettingsDialog`
Modal for editing team settings.
- Update team name
- Update team slug
- Update team logo URL

#### `InviteMemberDialog`
Modal for inviting new team members.
- Email input for invitation
- Role selection (Member, Admin, Owner)
- Sends invitation to existing users

### Team Event Configuration

#### `TeamEventForm`
Form for creating/editing team event types.
- Basic event information (title, description, duration)
- Location settings
- Scheduling type selection (Collective vs Round Robin)
- Integration with team-specific settings

#### `RoundRobinSettings`
Configuration for round-robin scheduling.
- Select which team members participate in rotation
- Visual member selection with avatars
- Shows member count and selection status

#### `CollectiveAvailabilityPreview`
Preview of collective team availability.
- Shows common available time slots
- Displays individual member availability
- Date selector for viewing different days

#### `TeamEventBookingFlow`
Public-facing booking interface for team events.
- Displays team information
- Shows scheduling type (Collective/Round Robin)
- Lists participating team members
- Integrates with time slot selection

## Service Integration

All components integrate with `services/team-service.ts` which provides:

### Client-side Functions
- `createTeam()` - Create a new team
- `getUserTeams()` - Get all teams for a user
- `getTeam()` - Get single team details
- `updateTeam()` - Update team information
- `deleteTeam()` - Delete a team
- `inviteTeamMember()` - Invite a user to join team
- `getTeamMembers()` - Get all team members
- `updateTeamMemberRole()` - Change member's role
- `removeTeamMember()` - Remove a member from team
- `acceptTeamInvitation()` - Accept team invitation
- `declineTeamInvitation()` - Decline team invitation

### Server-side Functions
- All CRUD operations for teams and members
- Team availability calculations
- Round-robin assignment logic
- Load balancing for team members
- Collective availability computation

## Team Availability Logic

### Collective Scheduling
- **All team members must be available** at the selected time
- System finds intersection of all members' availability
- Suitable for meetings requiring full team presence
- Example: Team standup, all-hands meetings

### Round-Robin Scheduling
- **One available member is assigned** to each booking
- System distributes bookings evenly based on:
  - Current availability
  - Recent booking load (last 30 days)
  - Member selection in settings
- Suitable for support, consultations, interviews
- Example: Customer support calls, sales demos

## Usage Example

```tsx
import { TeamManagement } from '@/components/teams'

export default function TeamsPage() {
  const userId = 'user-id' // Get from auth

  return (
    <div className="container mx-auto py-8">
      <TeamManagement userId={userId} />
    </div>
  )
}
```

## Features Implemented

✅ Team CRUD operations
✅ Team member invitation system
✅ Role-based access control (Owner, Admin, Member)
✅ Invitation acceptance workflow
✅ Collective availability calculation
✅ Round-robin assignment algorithm
✅ Load balancing for team members
✅ Team event type configuration
✅ Team-specific booking flow
✅ Availability preview for collective scheduling

## Requirements Satisfied

- **Requirement 6.1**: Team creation and member management
- **Requirement 6.2**: Collective availability (all members must be available)
- **Requirement 6.3**: Round-robin assignment
- **Requirement 6.4**: Load balancing for team members
- **Requirement 6.5**: Team event notifications

## Future Enhancements

- Real-time availability updates
- Team analytics and reporting
- Advanced scheduling rules
- Team calendar integration
- Bulk member operations
- Team templates
