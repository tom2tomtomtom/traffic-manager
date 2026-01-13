import { SupabaseClient } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'manager' | 'viewer' | 'member'

export interface CurrentUser {
  id: string
  email: string
  role: UserRole
  teamMemberId: string | null
  teamMemberName: string | null
}

/**
 * Get the current user with their role and linked team member info
 */
export async function getCurrentUser(supabase: SupabaseClient): Promise<CurrentUser | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Get linked team member
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id, full_name')
    .eq('profile_id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email!,
    role: (profile?.role || 'member') as UserRole,
    teamMemberId: teamMember?.id || null,
    teamMemberName: teamMember?.full_name || null,
  }
}

/**
 * Check if user role can edit data (admin or manager)
 */
export function canEdit(role: UserRole): boolean {
  return role === 'admin' || role === 'manager'
}

/**
 * Check if user role can manage other users (admin only)
 */
export function canManageUsers(role: UserRole): boolean {
  return role === 'admin'
}

/**
 * Check if user role can access the main app (not pending approval)
 */
export function canAccessApp(role: UserRole): boolean {
  return role !== 'member'
}

/**
 * Get role display info
 */
export function getRoleInfo(role: UserRole): { label: string; color: string } {
  switch (role) {
    case 'admin':
      return { label: 'Admin', color: 'bg-red-hot text-white' }
    case 'manager':
      return { label: 'Manager', color: 'bg-orange-accent text-black-ink' }
    case 'viewer':
      return { label: 'Viewer', color: 'bg-border-subtle text-white-muted' }
    case 'member':
    default:
      return { label: 'Pending', color: 'bg-black-deep text-white-dim' }
  }
}
