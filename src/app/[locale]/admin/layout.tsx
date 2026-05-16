import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/modules/auth/actions'
import type { AppRole } from '@/lib/dashboard-access'

interface AdminLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params
  const user = await getCurrentUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect(`/${locale}/login`)
  }

  const role = (user.role || 'student') as AppRole

  // Allow only super_admin and academic_manager roles
  if (role !== 'super_admin' && role !== 'academic_manager') {
    redirect(`/${locale}`)
  }

  return <>{children}</>
}
