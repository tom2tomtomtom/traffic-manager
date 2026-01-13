'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Check, Shield, Eye, UserCog } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'

interface Profile {
  id: string
  email: string
  role: string
  created_at: string
}

type Role = 'viewer' | 'manager' | 'admin'

const roleConfig = {
  member: { label: 'Pending', icon: Clock, color: 'text-yellow-electric' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-blue-400' },
  manager: { label: 'Manager', icon: UserCog, color: 'text-orange-accent' },
  admin: { label: 'Admin', icon: Shield, color: 'text-red-hot' },
}

export function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const { profiles } = await res.json()
        setProfiles(profiles)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const updateRole = async (userId: string, newRole: Role) => {
    setUpdating(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (res.ok) {
        const { profile } = await res.json()
        setProfiles(prev => prev.map(p =>
          p.id === userId ? { ...p, role: profile.role } : p
        ))
        toast.success(`Updated to ${newRole}`)
        router.refresh()
      } else {
        const { error } = await res.json()
        toast.error(error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Failed to update role:', error)
      toast.error('Failed to update role')
    } finally {
      setUpdating(null)
    }
  }

  const pendingUsers = profiles.filter(p => p.role === 'member')
  const approvedUsers = profiles.filter(p => p.role !== 'member')

  if (loading) {
    return (
      <div className="bg-black-card border-2 border-border-subtle p-8 text-center">
        <p className="text-white-muted">Loading users...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Pending Approval Section */}
      <div className="bg-black-card border-2 border-yellow-electric/50 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-yellow-electric mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Pending Approval ({pendingUsers.length})
        </h2>

        {pendingUsers.length === 0 ? (
          <p className="text-white-dim text-sm">No users waiting for approval</p>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-black-deep border-2 border-border-subtle"
              >
                <div>
                  <p className="text-white-full font-medium">{user.email}</p>
                  <p className="text-white-dim text-xs mt-1">
                    Signed up {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => updateRole(user.id, 'viewer')}
                    disabled={updating === user.id}
                    className={cn(
                      'px-4 py-2 text-xs font-bold uppercase border-2 transition-all',
                      'border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black-ink',
                      updating === user.id && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Viewer
                  </button>
                  <button
                    onClick={() => updateRole(user.id, 'manager')}
                    disabled={updating === user.id}
                    className={cn(
                      'px-4 py-2 text-xs font-bold uppercase border-2 transition-all',
                      'border-orange-accent text-orange-accent hover:bg-orange-accent hover:text-black-ink',
                      updating === user.id && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Manager
                  </button>
                  <button
                    onClick={() => updateRole(user.id, 'admin')}
                    disabled={updating === user.id}
                    className={cn(
                      'px-4 py-2 text-xs font-bold uppercase border-2 transition-all',
                      'border-red-hot text-red-hot hover:bg-red-hot hover:text-white',
                      updating === user.id && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Admin
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Users Section */}
      <div className="bg-black-card border-2 border-border-subtle p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-orange-accent mb-4 flex items-center gap-2">
          <Check className="w-4 h-4" />
          Active Users ({approvedUsers.length})
        </h2>

        {approvedUsers.length === 0 ? (
          <p className="text-white-dim text-sm">No active users yet</p>
        ) : (
          <div className="space-y-2">
            {approvedUsers.map(user => {
              const config = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.viewer
              const Icon = config.icon

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-black-deep border-2 border-border-subtle"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('w-4 h-4', config.color)} />
                    <div>
                      <p className="text-white-full font-medium">{user.email}</p>
                      <p className={cn('text-xs font-bold uppercase', config.color)}>
                        {config.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {user.role !== 'viewer' && (
                      <button
                        onClick={() => updateRole(user.id, 'viewer')}
                        disabled={updating === user.id}
                        className="px-3 py-1 text-xs text-white-dim hover:text-blue-400 transition-colors"
                      >
                        → Viewer
                      </button>
                    )}
                    {user.role !== 'manager' && (
                      <button
                        onClick={() => updateRole(user.id, 'manager')}
                        disabled={updating === user.id}
                        className="px-3 py-1 text-xs text-white-dim hover:text-orange-accent transition-colors"
                      >
                        → Manager
                      </button>
                    )}
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => updateRole(user.id, 'admin')}
                        disabled={updating === user.id}
                        className="px-3 py-1 text-xs text-white-dim hover:text-red-hot transition-colors"
                      >
                        → Admin
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
