'use client'

import { Bell, Search, User, Settings, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

interface TopbarProps {
  user?: {
    name: string
    email: string
    roleLabel: string
    avatar?: string
  }
}

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-4 md:px-6">
        {/* Search */}
        <div className="hidden max-w-md flex-1 md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search courses, tests, classes..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-sm placeholder-zinc-500 transition-colors focus:border-zinc-950 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:focus:bg-zinc-800"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 md:inline-flex">
            <ShieldCheck size={14} />
            <span>{user?.roleLabel ?? 'Member'}</span>
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          {/* Settings */}
          <Link href="/dashboard/settings">
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              <Settings size={20} />
            </Button>
          </Link>

          {/* User profile */}
          <Link href="/dashboard/settings" className="inline-flex">
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <User size={20} />
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
