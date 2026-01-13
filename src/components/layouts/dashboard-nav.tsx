'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Upload, BarChart3, LogOut, User, FileText, FolderKanban, Users, LayoutDashboard, Settings, Shield } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { UserRole, canEdit, getRoleInfo } from '@/lib/auth/permissions'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  requiresEdit?: boolean  // Only show if user can edit
  requiresAdmin?: boolean // Only show if user is admin
}

const navItems: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: 'Upload',
    href: '/upload',
    icon: <Upload className="w-4 h-4" />,
    requiresEdit: true,
  },
  {
    label: 'Transcripts',
    href: '/transcripts',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: <FolderKanban className="w-4 h-4" />,
  },
  {
    label: 'Capacity',
    href: '/capacity',
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    label: 'Team',
    href: '/team',
    icon: <Users className="w-4 h-4" />,
  },
  {
    label: 'Setup',
    href: '/setup',
    icon: <Settings className="w-4 h-4" />,
    requiresEdit: true,
  },
  {
    label: 'Admin',
    href: '/admin',
    icon: <Shield className="w-4 h-4" />,
    requiresAdmin: true,
  },
]

interface DashboardNavProps {
  user: SupabaseUser
  role: UserRole
}

export function DashboardNav({ user, role }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const userCanEdit = canEdit(role)
  const roleInfo = getRoleInfo(role)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Filter nav items based on role
  const visibleNavItems = navItems.filter(item => {
    if (item.requiresEdit && !userCanEdit) return false
    if (item.requiresAdmin && role !== 'admin') return false
    return true
  })

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black-deep border-b-2 border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-red-hot uppercase tracking-wider">
                Alt/Shift
              </span>
              <span className="text-white-dim text-sm uppercase tracking-wide hidden sm:block">
                Traffic
              </span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-1">
              {visibleNavItems.map((item) => {
                const isActive = item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wide font-bold',
                      'border-2 transition-all',
                      isActive
                        ? 'bg-orange-accent text-black-ink border-orange-accent'
                        : 'bg-transparent text-white-muted border-transparent hover:border-border-subtle hover:text-white-full'
                    )}
                  >
                    {item.icon}
                    <span className="hidden sm:block">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Role Badge */}
            <span className={cn(
              'px-2 py-1 text-[10px] uppercase font-bold tracking-wide hidden sm:block',
              roleInfo.color
            )}>
              {roleInfo.label}
            </span>

            <div className="flex items-center gap-2 text-white-muted">
              <User className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide hidden sm:block">
                {user.email?.split('@')[0]}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wide font-bold',
                'border-2 border-border-subtle text-white-muted',
                'hover:border-red-hot hover:text-red-hot transition-all'
              )}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
