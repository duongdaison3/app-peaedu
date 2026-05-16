import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'

export default function AdminRootPage() {
  redirect(`/${routing.defaultLocale}/admin/dashboard`)
}
