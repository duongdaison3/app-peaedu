import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'

interface AdminRootAliasPageProps {
  params: Promise<{ slug: string[] }>
}

export default async function AdminRootAliasPage({ params }: AdminRootAliasPageProps) {
  const { slug } = await params
  const suffix = slug?.length ? `/${slug.join('/')}` : ''
  redirect(`/${routing.defaultLocale}/admin${suffix}`)
}
