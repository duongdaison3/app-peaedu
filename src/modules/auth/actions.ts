'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import type { UserRole, UserStatus } from '@prisma/client'
import { routing } from '@/i18n/routing'

type AuthActionResult =
  | { success: true }
  | { success: false; message: string }

type OAuthActionResult =
  | { success: true; url: string }
  | { success: false; message: string }

export async function signInWithPassword(formData: FormData): Promise<void> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const locale = (formData.get('locale') as string) || routing.defaultLocale
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const message = encodeURIComponent(error.message || 'Could not authenticate user')
    redirect(`/${locale}/login?message=${message}`)
  }

  const authUser = data.user
  if (!authUser) {
    redirect(`/${locale}/login?message=${encodeURIComponent('Could not load user session')}`)
  }

  const displayName =
    ((authUser.user_metadata?.full_name as string | undefined) ||
      (authUser.user_metadata?.name as string | undefined) ||
      authUser.email?.split('@')[0] ||
      'User')

  // Ensure user exists in Prisma on every sign-in so role-based redirects can work.
  const dbUser = await prisma.user.upsert({
    where: { id: authUser.id },
    update: {
      email: authUser.email || email,
      fullName: displayName,
    },
    create: {
      id: authUser.id,
      email: authUser.email || email,
      fullName: displayName,
      role: 'student',
      username: `${(authUser.email || email).split('@')[0]}_${authUser.id.slice(0, 8)}`,
    },
  })

  const role = dbUser.role

  if (role === 'super_admin' || role === 'academic_manager') {
    redirect(`/${locale}/admin/dashboard`)
  }

  if (role === 'teacher') {
    redirect(`/${locale}/teacher/dashboard`)
  }

  if (role === 'student') {
    redirect(`/${locale}/student/dashboard`)
  }

  redirect(`/${locale}/dashboard`)
}

export async function signUp(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    return { success: false, message: 'Could not sign up user' }
  }

  return { success: true }
}

export async function signInWithGoogle(): Promise<OAuthActionResult> {
  const supabase = await createClient()
  
  // Note: we need the absolute URL for the callback
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { success: false, message: error.message || 'Google login failed' }
  }

  if (!data.url) {
    return { success: false, message: 'Google login failed' }
  }

  return { success: true, url: data.url }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect(`/${routing.defaultLocale}/login`)
}

/**
 * Get current user with role
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      role: true,
      status: true,
      username: true,
      createdAt: true,
      updatedAt: true,
      classesTeaching: { select: { id: true, title: true } },
      classStudents: { select: { classId: true } }
    }
  })

  return dbUser
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireRoles(roles: UserRole[]) {
  const user = await requireAuthenticatedUser()
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden')
  }
  return user
}

/**
 * Create or sync user in database after auth
 */
export async function syncUserToDB(
  id: string,
  email: string,
  fullName: string | null,
  role: UserRole = 'student'
) {
  try {
    const user = await prisma.user.upsert({
      where: { id },
      update: { fullName },
      create: {
        id,
        email,
        fullName: fullName || email.split('@')[0],
        role,
        username: email.split('@')[0]
      }
    })

    return { success: true, user }
  } catch (error) {
    console.error('Error syncing user:', error)
    return { success: false, error }
  }
}

/**
 * Check if user has permission for role
 */
export async function checkUserRole(requiredRoles: UserRole[]) {
  const user = await requireAuthenticatedUser()
  
  if (!requiredRoles.includes(user.role)) {
    redirect('/')
  }

  return user
}

/**
 * Update current user's profile (display name, avatar)
 */
export async function updateUserProfile({
  fullName,
  avatarUrl
}: {
  fullName?: string | null
  avatarUrl?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(fullName !== undefined && { fullName }),
      ...(avatarUrl !== undefined && { avatarUrl })
    }
  })

  return updated
}

export async function getUsersForManagement({
  query,
  role,
  status
}: {
  query?: string
  role?: UserRole
  status?: UserStatus
} = {}) {
  await requireRoles(['super_admin', 'academic_manager'])

  const users = await prisma.user.findMany({
    where: {
      ...(query
        ? {
            OR: [
              { email: { contains: query, mode: 'insensitive' } },
              { fullName: { contains: query, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(role ? { role } : {}),
      ...(status ? { status } : {})
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          classesTeaching: true,
          testAttempts: true,
          testsCreated: true
        }
      }
    }
  })

  return users
}

export async function updateUserRoleByAdmin(userId: string, role: UserRole) {
  const actor = await requireRoles(['super_admin', 'academic_manager'])

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) throw new Error('User not found')

  if (actor.role === 'academic_manager') {
    if (target.role === 'super_admin' || role === 'super_admin') {
      throw new Error('Forbidden')
    }
  }

  if (target.id === actor.id && role !== 'super_admin' && actor.role === 'super_admin') {
    throw new Error('Super admin cannot self-demote')
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role }
  })

  return updated
}

export async function updateUserStatusByAdmin(userId: string, status: UserStatus) {
  const actor = await requireRoles(['super_admin', 'academic_manager'])

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) throw new Error('User not found')

  if (actor.role === 'academic_manager' && target.role === 'super_admin') {
    throw new Error('Forbidden')
  }

  if (target.id === actor.id && status !== 'active') {
    throw new Error('Cannot deactivate current account')
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status }
  })

  return updated
}
