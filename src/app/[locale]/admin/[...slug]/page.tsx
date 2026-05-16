import { redirect } from 'next/navigation'

interface AdminAliasPageProps {
  params: Promise<{ locale: string; slug: string[] }>
}

const ADMIN_TO_DASHBOARD_SECTIONS = new Set([
  'users',
  'courses',
  'tests',
  'analytics',
  'classes',
  'question-bank',
  'settings',
  'test-attempt',
  'test-results'
])

export default async function AdminAliasPage({ params }: AdminAliasPageProps) {
  const { locale, slug } = await params

  if (!slug || slug.length === 0) {
    redirect(`/${locale}/admin/dashboard`)
  }

  const [section, ...rest] = slug

  if (section === 'dashboard') {
    redirect(`/${locale}/admin/dashboard`)
  }

  if (!ADMIN_TO_DASHBOARD_SECTIONS.has(section)) {
    redirect(`/${locale}/admin/dashboard`)
  }

  const remainder = rest.length ? `/${rest.join('/')}` : ''
  redirect(`/${locale}/dashboard/${section}${remainder}`)
}
