'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Link } from '@/i18n/routing'

export function AdminDashboardClient() {
  const t = useTranslations('Admin')
  const [stats] = useState({
    totalUsers: 0,
    totalClasses: 0,
    totalTests: 0,
    totalAttempts: 0
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">System overview and management</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Classes</p>
            <p className="text-3xl font-bold text-green-600">{stats.totalClasses}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Tests</p>
            <p className="text-3xl font-bold text-purple-600">{stats.totalTests}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Test Attempts</p>
            <p className="text-3xl font-bold text-orange-600">{stats.totalAttempts}</p>
          </div>
        </div>

        {/* Management Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/users">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg cursor-pointer transition">
              <h3 className="text-lg font-bold text-gray-900 mb-2">User Management</h3>
              <p className="text-gray-600 text-sm">Manage users and their roles</p>
            </div>
          </Link>

          <Link href="/admin/courses">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg cursor-pointer transition">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Courses</h3>
              <p className="text-gray-600 text-sm">Manage courses and classes</p>
            </div>
          </Link>

          <Link href="/admin/tests">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg cursor-pointer transition">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Tests & Questions</h3>
              <p className="text-gray-600 text-sm">Review and manage all tests</p>
            </div>
          </Link>

          <Link href="/admin/analytics">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg cursor-pointer transition">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Analytics</h3>
              <p className="text-gray-600 text-sm">System-wide performance metrics</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
