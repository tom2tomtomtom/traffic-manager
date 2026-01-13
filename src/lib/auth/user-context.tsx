'use client'

import { createContext, useContext, ReactNode } from 'react'
import { UserRole, canEdit, canManageUsers, canAccessApp, getRoleInfo } from './permissions'

interface UserContextValue {
  role: UserRole
  teamMemberId: string | null
  teamMemberName: string | null
  canEdit: boolean
  canManageUsers: boolean
  canAccessApp: boolean
  roleInfo: { label: string; color: string }
}

const UserContext = createContext<UserContextValue | null>(null)

interface UserProviderProps {
  children: ReactNode
  role: UserRole
  teamMemberId?: string | null
  teamMemberName?: string | null
}

export function UserProvider({
  children,
  role,
  teamMemberId = null,
  teamMemberName = null
}: UserProviderProps) {
  const value: UserContextValue = {
    role,
    teamMemberId,
    teamMemberName,
    canEdit: canEdit(role),
    canManageUsers: canManageUsers(role),
    canAccessApp: canAccessApp(role),
    roleInfo: getRoleInfo(role),
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

/**
 * Hook to check if current user can edit
 * Returns false if outside UserProvider (safe default)
 */
export function useCanEdit(): boolean {
  const context = useContext(UserContext)
  return context?.canEdit ?? false
}
