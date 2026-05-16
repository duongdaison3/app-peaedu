import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { getCurrentUser } from '@/modules/auth/actions'
import { canAccessDashboardPath, getRoleDisplayName, type AppRole } from '@/lib/dashboard-access'

interface DashboardLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { locale } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const role = (user.role || 'student') as AppRole

  if (!canAccessDashboardPath(role, '/dashboard')) {
    redirect(`/${locale}`)
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <Sidebar role={role} />
      <div className="md:ml-64">
        <Topbar
          user={{
            name: user.fullName || user.email,
            email: user.email,
            roleLabel: getRoleDisplayName(role),
            avatar: user.avatarUrl || undefined,
          }}
        />
        <main className="px-4 py-4 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
  )
}
