'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { User, Edit2, X, Plus, Check, Trash2 } from 'lucide-react'
import { useCanEdit } from '@/lib/auth/user-context'

interface TeamMember {
  id: string
  full_name: string
  email: string | null
  role: string
  weekly_capacity_hours: number
  core_roles: string[]
  capabilities: string[]
  industries: string[]
  known_clients: string[]
  active: boolean
  allocated_hours: number
  available_hours: number
}

interface TeamDirectoryProps {
  initialMembers: TeamMember[]
}

export function TeamDirectory({ initialMembers }: TeamDirectoryProps) {
  const router = useRouter()
  const canEdit = useCanEdit()
  const [members, setMembers] = useState(initialMembers)
  const [showInactive, setShowInactive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    role: '',
    weekly_capacity_hours: 40,
    core_roles: [] as string[],
    capabilities: [] as string[],
    industries: [] as string[],
    known_clients: [] as string[],
  })

  // Tag input states
  const [newCoreRole, setNewCoreRole] = useState('')
  const [newCapability, setNewCapability] = useState('')
  const [newIndustry, setNewIndustry] = useState('')
  const [newClient, setNewClient] = useState('')

  const filteredMembers = members.filter(m => {
    if (!showInactive && !m.active) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        m.full_name.toLowerCase().includes(query) ||
        m.role.toLowerCase().includes(query) ||
        m.core_roles?.some(r => r.toLowerCase().includes(query)) ||
        m.industries?.some(i => i.toLowerCase().includes(query)) ||
        m.known_clients?.some(c => c.toLowerCase().includes(query))
      )
    }
    return true
  })

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member)
    setEditForm({
      full_name: member.full_name,
      email: member.email || '',
      role: member.role,
      weekly_capacity_hours: member.weekly_capacity_hours,
      core_roles: member.core_roles || [],
      capabilities: member.capabilities || [],
      industries: member.industries || [],
      known_clients: member.known_clients || [],
    })
  }

  const handleSave = async () => {
    if (!editingMember) return

    setSaving(true)
    try {
      const res = await fetch(`/api/team/${editingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm),
      })

      if (res.ok) {
        router.refresh()
        setEditingMember(null)
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!editingMember) return

    setSaving(true)
    try {
      const res = await fetch(`/api/team/${editingMember.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        router.refresh()
        setEditingMember(null)
      }
    } catch (error) {
      console.error('Failed to deactivate:', error)
    } finally {
      setSaving(false)
    }
  }

  // Tag management helpers
  const addTag = (field: 'core_roles' | 'capabilities' | 'industries' | 'known_clients', value: string) => {
    if (!value.trim()) return
    const trimmed = value.trim()
    if (!editForm[field].includes(trimmed)) {
      setEditForm(prev => ({
        ...prev,
        [field]: [...prev[field], trimmed],
      }))
    }
  }

  const removeTag = (field: 'core_roles' | 'capabilities' | 'industries' | 'known_clients', index: number) => {
    setEditForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const getUtilization = (member: TeamMember) => {
    return Math.round((member.allocated_hours / member.weekly_capacity_hours) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search by name, role, industry, or client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-black-deep border-2 border-border-subtle text-white-full px-4 py-2 focus:border-orange-accent focus:outline-none"
        />
        <label className="flex items-center gap-2 text-white-muted text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 accent-orange-accent"
          />
          Show Inactive
        </label>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map(member => {
          const utilization = getUtilization(member)
          const isOverallocated = member.available_hours < 0

          return (
            <Card
              key={member.id}
              className={cn(
                'p-4 relative',
                !member.active && 'opacity-50',
                isOverallocated && 'border-red-hot'
              )}
              hoverable={false}
            >
              {/* Utilization bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-black-deep">
                <div
                  className={cn(
                    'h-full transition-all',
                    isOverallocated ? 'bg-red-hot' : 'bg-orange-accent'
                  )}
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                />
              </div>

              <div className="pt-2">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-accent/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-orange-accent" />
                    </div>
                    <div>
                      <h3 className="text-white-full font-bold">{member.full_name}</h3>
                      <p className="text-white-dim text-xs uppercase">{member.role}</p>
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => openEditModal(member)}
                      className="p-2 text-white-dim hover:text-orange-accent transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Capacity */}
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-white-muted">Capacity</span>
                  <span className={cn(
                    'font-bold',
                    isOverallocated ? 'text-red-hot' : 'text-orange-accent'
                  )}>
                    {member.allocated_hours}h / {member.weekly_capacity_hours}h ({utilization}%)
                  </span>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  {member.core_roles && member.core_roles.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {member.core_roles.map((role, i) => (
                        <span key={i} className="px-2 py-0.5 text-[10px] uppercase font-bold bg-orange-accent/20 text-orange-accent">
                          {role}
                        </span>
                      ))}
                    </div>
                  )}

                  {member.industries && member.industries.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {member.industries.map((ind, i) => (
                        <span key={i} className="px-2 py-0.5 text-[10px] uppercase bg-border-subtle text-white-dim">
                          {ind}
                        </span>
                      ))}
                    </div>
                  )}

                  {member.known_clients && member.known_clients.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {member.known_clients.slice(0, 3).map((client, i) => (
                        <span key={i} className="px-2 py-0.5 text-[10px] bg-black-deep text-white-muted">
                          {client}
                        </span>
                      ))}
                      {member.known_clients.length > 3 && (
                        <span className="px-2 py-0.5 text-[10px] bg-black-deep text-white-dim">
                          +{member.known_clients.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {!member.active && (
                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <span className="text-red-hot text-xs uppercase font-bold">Inactive</span>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {filteredMembers.length === 0 && (
        <Card className="p-8 text-center" hoverable={false}>
          <p className="text-white-muted">No team members found.</p>
        </Card>
      )}

      {/* Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black-ink/80 flex items-center justify-center z-50 p-4">
          <div className="bg-black-card border-2 border-border-subtle p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-orange-accent uppercase">Edit Team Member</h2>
              <button
                onClick={() => setEditingMember(null)}
                className="text-white-dim hover:text-white-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-white-dim text-xs uppercase mb-2">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white-dim text-xs uppercase mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white-dim text-xs uppercase mb-2">Role</label>
                <input
                  type="text"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white-dim text-xs uppercase mb-2">Weekly Capacity (hours)</label>
                <input
                  type="number"
                  value={editForm.weekly_capacity_hours}
                  onChange={(e) => setEditForm({ ...editForm, weekly_capacity_hours: parseInt(e.target.value) || 40 })}
                  className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none"
                  min="0"
                  max="80"
                />
              </div>
            </div>

            {/* Core Roles */}
            <div className="mb-4">
              <label className="block text-white-dim text-xs uppercase mb-2">Core Roles</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editForm.core_roles.map((role, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 bg-orange-accent/20 text-orange-accent text-sm">
                    {role}
                    <button onClick={() => removeTag('core_roles', i)} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCoreRole}
                  onChange={(e) => setNewCoreRole(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag('core_roles', newCoreRole)
                      setNewCoreRole('')
                    }
                  }}
                  placeholder="e.g., Producer, Strategy, Creative"
                  className="flex-1 bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none text-sm"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    addTag('core_roles', newCoreRole)
                    setNewCoreRole('')
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Capabilities */}
            <div className="mb-4">
              <label className="block text-white-dim text-xs uppercase mb-2">Capabilities</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editForm.capabilities.map((cap, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 bg-border-subtle text-white-muted text-sm">
                    {cap}
                    <button onClick={() => removeTag('capabilities', i)} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCapability}
                  onChange={(e) => setNewCapability(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag('capabilities', newCapability)
                      setNewCapability('')
                    }
                  }}
                  placeholder="e.g., Video Production, Social Media, Events"
                  className="flex-1 bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none text-sm"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    addTag('capabilities', newCapability)
                    setNewCapability('')
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Industries */}
            <div className="mb-4">
              <label className="block text-white-dim text-xs uppercase mb-2">Industries</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editForm.industries.map((ind, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 bg-border-subtle text-white-muted text-sm">
                    {ind}
                    <button onClick={() => removeTag('industries', i)} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag('industries', newIndustry)
                      setNewIndustry('')
                    }
                  }}
                  placeholder="e.g., Travel/Tourism, Tech, Finance"
                  className="flex-1 bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none text-sm"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    addTag('industries', newIndustry)
                    setNewIndustry('')
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Known Clients */}
            <div className="mb-6">
              <label className="block text-white-dim text-xs uppercase mb-2">Known Clients</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editForm.known_clients.map((client, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 bg-black-deep text-white-muted text-sm">
                    {client}
                    <button onClick={() => removeTag('known_clients', i)} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag('known_clients', newClient)
                      setNewClient('')
                    }
                  }}
                  placeholder="e.g., Officeworks, Lego, Tourism Australia"
                  className="flex-1 bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none text-sm"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    addTag('known_clients', newClient)
                    setNewClient('')
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
              <Button
                variant="danger"
                onClick={handleDeactivate}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {editingMember.active ? 'Deactivate' : 'Already Inactive'}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setEditingMember(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
