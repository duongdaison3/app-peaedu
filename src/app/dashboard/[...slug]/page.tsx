import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'

interface DashboardAliasPageProps {
  params: Promise<{ slug: string[] }>
}

export default async function DashboardAliasPage({ params }: DashboardAliasPageProps) {
  const { slug } = await params
  const suffix = slug?.length ? `/${slug.join('/')}` : ''
  redirect(`/${routing.defaultLocale}/dashboard${suffix}`)
}
