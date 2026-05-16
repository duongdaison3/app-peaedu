'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import type { UserRole, UserStatus } from '@prisma/client'
import { useTranslations } from 'next-intl'
import {
  getUsersForManagement,
  updateUserRoleByAdmin,
  updateUserStatusByAdmin
} from '@/modules/auth/actions'

type ManagedUser = {
  id: string
  email: string
  fullName: string | null
  role: UserRole
  status: UserStatus
  createdAt: Date | string
  _count: {
    classesTeaching: number
    testAttempts: number
    testsCreated: number
  }
}

const roleOptions: UserRole[] = ['super_admin', 'academic_manager', 'teacher', 'student']
const statusOptions: UserStatus[] = ['active', 'inactive', 'suspended']

export default function UserManagementPage() {
  const t = useTranslations('Dashboard.userManagement')
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const loadUsers = () => {
    startTransition(async () => {
      setError(null)
      try {
        const data = await getUsersForManagement({
          query: query || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined
        })
        setUsers(data as ManagedUser[])
      } catch (e) {
        setError(e instanceof Error ? e.message : t('messages.loadError'))
      }
    })
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(user => user.status === 'active').length,
      teachers: users.filter(user => user.role === 'teacher').length,
      students: users.filter(user => user.role === 'student').length
    }
  }, [users])

  const handleRoleChange = (userId: string, role: UserRole) => {
    startTransition(async () => {
      setError(null)
      try {
        await updateUserRoleByAdmin(userId, role)
        await loadUsers()
      } catch (e) {
        setError(e instanceof Error ? e.message : t('messages.updateError'))
      }
    })
  }

  const handleStatusChange = (userId: string, status: UserStatus) => {
    startTransition(async () => {
      setError(null)
      try {
        await updateUserStatusByAdmin(userId, status)
        await loadUsers()
      } catch (e) {
        setError(e instanceof Error ? e.message : t('messages.updateError'))
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-zinc-950 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('stats.totalUsers')} value={stats.total} />
        <StatCard label={t('stats.activeUsers')} value={stats.active} />
        <StatCard label={t('stats.teachers')} value={stats.teachers} />
        <StatCard label={t('stats.students')} value={stats.students} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={t('filters.searchPlaceholder')}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />

          <select
            value={roleFilter}
            onChange={event => setRoleFilter((event.target.value as UserRole) || '')}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">{t('filters.allRoles')}</option>
            {roleOptions.map(role => (
              <option key={role} value={role}>{t(`roles.${role}`)}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={event => setStatusFilter((event.target.value as UserStatus) || '')}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">{t('filters.allStatuses')}</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{t(`statuses.${status}`)}</option>
            ))}
          </select>

          <button
            onClick={loadUsers}
            disabled={pending}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            {pending ? t('actions.loading') : t('actions.applyFilters')}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/70">
              <tr className="text-zinc-600 dark:text-zinc-300">
                <th className="px-4 py-3">{t('table.user')}</th>
                <th className="px-4 py-3">{t('table.role')}</th>
                <th className="px-4 py-3">{t('table.status')}</th>
                <th className="px-4 py-3">{t('table.workload')}</th>
                <th className="px-4 py-3">{t('table.joinedAt')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{user.fullName || '-'}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={event => handleRoleChange(user.id, event.target.value as UserRole)}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      {roleOptions.map(role => (
                        <option key={role} value={role}>{t(`roles.${role}`)}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={user.status}
                      onChange={event => handleStatusChange(user.id, event.target.value as UserStatus)}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{t(`statuses.${status}`)}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">
                    <div>{t('table.classes')}: {user._count.classesTeaching}</div>
                    <div>{t('table.tests')}: {user._count.testsCreated}</div>
                    <div>{t('table.attempts')}: {user._count.testAttempts}</div>
                  </td>

                  <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {!pending && users.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-zinc-500" colSpan={5}>{t('messages.empty')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  )
}
