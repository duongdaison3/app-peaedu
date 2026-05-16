'use client'

import { Link } from '@/i18n/routing'
import { usePathname } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  ClipboardList, 
  BarChart3, 
  Settings,
  ChevronRight,
  LogOut,
  CircleHelp,
  ClipboardCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/modules/auth/actions'
import { getAllowedDashboardNav, type AppRole } from '@/lib/dashboard-access'

interface NavItem {
  icon: React.ReactNode
  labelKey: string
  href: string
  section: 'overview' | 'teaching' | 'assessment' | 'system'
}

interface SidebarProps {
  role: AppRole
}

const sectionTitleKeys: Record<NavItem['section'], string> = {
  overview: 'navSections.overview',
  teaching: 'navSections.teaching',
  assessment: 'navSections.assessment',
  system: 'navSections.system',
}

export function Sidebar({ role }: SidebarProps) {
  const t = useTranslations('Dashboard')
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      icon: <LayoutDashboard size={20} />,
      labelKey: 'nav.overview',
      href: '/dashboard',
      section: 'overview',
    },
    {
      icon: <BookOpen size={20} />,
      labelKey: 'nav.courses',
      href: '/dashboard/courses',
      section: 'teaching',
    },
    {
      icon: <Users size={20} />,
      labelKey: 'nav.classes',
      href: '/dashboard/classes',
      section: 'teaching',
    },
    {
      icon: <ClipboardList size={20} />,
      labelKey: 'nav.tests',
      href: '/dashboard/tests',
      section: 'assessment',
    },
    {
      icon: <CircleHelp size={20} />,
      labelKey: 'nav.questionBank',
      href: '/dashboard/question-bank',
      section: 'assessment',
    },
    {
      icon: <ClipboardCheck size={20} />,
      labelKey: 'nav.grading',
      href: '/dashboard/grading',
      section: 'assessment',
    },
    {
      icon: <BarChart3 size={20} />,
      labelKey: 'nav.analytics',
      href: '/dashboard/analytics',
      section: 'system',
    },
    {
      icon: <Users size={20} />,
      labelKey: 'nav.users',
      href: '/dashboard/users',
      section: 'system',
    },
    {
      icon: <Settings size={20} />,
      labelKey: 'nav.settings',
      href: '/dashboard/settings',
      section: 'system',
    },
  ]

  const allowedHrefs = new Set(getAllowedDashboardNav(role).map(item => item.href))
  const visibleNavItems = navItems.filter(item => allowedHrefs.has(item.href))

  const isActive = (href: string) => pathname.endsWith(href) || pathname.includes(href)

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 overflow-y-auto border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:block">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
          <img 
            src="/peaedu-logo.png" 
            alt="PEA Education" 
            className="h-8 w-8 object-contain"
          />
          <div>
            <p className="text-sm font-bold text-zinc-950 dark:text-white">PEA</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Assessment</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-5 px-4 py-6">
          {Object.keys(sectionTitleKeys).map((sectionKey) => {
            const section = sectionKey as NavItem['section']
            const items = visibleNavItems.filter(item => item.section === section)

            if (items.length === 0) return null

            return (
              <div key={section} className="space-y-1">
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  {t(sectionTitleKeys[section])}
                </p>
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors
                      ${
                        isActive(item.href)
                          ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                      }
                    `}
                  >
                    {item.icon}
                    <span className="flex-1">{t(item.labelKey)}</span>
                    {isActive(item.href) && <ChevronRight size={16} />}
                  </Link>
                ))}
              </div>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <form action={signOut}>
            <Button 
              type="submit"
              className="w-full justify-start gap-3 rounded-lg px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-red-50 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
              variant="ghost"
            >
              <LogOut size={20} />
              <span>{t('actions.signOut')}</span>
            </Button>
          </form>
        </div>
      </div>
    </aside>
  )
}
