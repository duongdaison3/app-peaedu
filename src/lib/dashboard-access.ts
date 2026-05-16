export type AppRole = 'super_admin' | 'academic_manager' | 'teacher' | 'student'

export interface DashboardNavItem {
  href: string
  label: string
  section: 'overview' | 'teaching' | 'assessment' | 'system'
  roles: AppRole[]
}

export const dashboardNavItems: DashboardNavItem[] = [
  {
    href: '/dashboard',
    label: 'Overview',
    section: 'overview',
    roles: ['super_admin', 'academic_manager', 'teacher', 'student'],
  },
  {
    href: '/dashboard/courses',
    label: 'Courses',
    section: 'teaching',
    roles: ['super_admin', 'academic_manager', 'teacher'],
  },
  {
    href: '/dashboard/classes',
    label: 'Classes',
    section: 'teaching',
    roles: ['super_admin', 'academic_manager', 'teacher', 'student'],
  },
  {
    href: '/dashboard/tests',
    label: 'Tests',
    section: 'assessment',
    roles: ['super_admin', 'academic_manager', 'teacher'],
  },
  {
    href: '/dashboard/question-bank',
    label: 'Question Bank',
    section: 'assessment',
    roles: ['super_admin', 'academic_manager', 'teacher'],
  },
  {
    href: '/dashboard/grading',
    label: 'Grading',
    section: 'assessment',
    roles: ['super_admin', 'academic_manager', 'teacher'],
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    section: 'system',
    roles: ['super_admin', 'academic_manager', 'teacher'],
  },
  {
    href: '/dashboard/users',
    label: 'User Management',
    section: 'system',
    roles: ['super_admin', 'academic_manager'],
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    section: 'system',
    roles: ['super_admin', 'academic_manager', 'teacher', 'student'],
  },
]

const routePermissions: Array<{ prefix: string; roles: AppRole[] }> = [
  { prefix: '/dashboard/question-bank', roles: ['super_admin', 'academic_manager', 'teacher'] },
  { prefix: '/dashboard/tests', roles: ['super_admin', 'academic_manager', 'teacher'] },
  { prefix: '/dashboard/grading', roles: ['super_admin', 'academic_manager', 'teacher'] },
  { prefix: '/dashboard/analytics', roles: ['super_admin', 'academic_manager', 'teacher'] },
  { prefix: '/dashboard/users', roles: ['super_admin', 'academic_manager'] },
  { prefix: '/dashboard/courses', roles: ['super_admin', 'academic_manager', 'teacher'] },
  { prefix: '/dashboard/classes', roles: ['super_admin', 'academic_manager', 'teacher', 'student'] },
  { prefix: '/dashboard/settings', roles: ['super_admin', 'academic_manager', 'teacher', 'student'] },
  { prefix: '/dashboard/test-attempt', roles: ['student', 'teacher', 'academic_manager', 'super_admin'] },
  { prefix: '/dashboard/test-results', roles: ['student', 'teacher', 'academic_manager', 'super_admin'] },
  { prefix: '/dashboard', roles: ['super_admin', 'academic_manager', 'teacher', 'student'] },
]

export function getAllowedDashboardNav(role: AppRole) {
  return dashboardNavItems.filter(item => item.roles.includes(role))
}

export function canAccessDashboardPath(role: AppRole, pathWithoutLocale: string) {
  const normalized = pathWithoutLocale.startsWith('/')
    ? pathWithoutLocale
    : `/${pathWithoutLocale}`

  const match = routePermissions.find(rule => normalized.startsWith(rule.prefix))
  if (!match) return true
  return match.roles.includes(role)
}

export function getRoleDisplayName(role: AppRole) {
  if (role === 'super_admin') return 'Super Admin'
  if (role === 'academic_manager') return 'Academic Manager'
  if (role === 'teacher') return 'Teacher'
  return 'Student'
}
