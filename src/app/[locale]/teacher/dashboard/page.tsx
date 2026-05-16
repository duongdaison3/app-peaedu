'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getCurrentUser, getClasses } from '@/modules'
import Link from 'next/link'

export default function TeacherDashboard() {
  const t = useTranslations('Teacher')
  const [classes, setClasses] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        
        const userClasses = await getClasses()
        setClasses(userClasses)
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Teacher Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Manage your classes and assessments</p>
            </div>
            <div className="space-x-2">
              <Link href="/teacher/tests">
                <Button variant="outline">
                  View Tests
                </Button>
              </Link>
              <Link href="/teacher/questions">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Question Bank
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Classes</p>
            <p className="text-3xl font-bold text-blue-600">{classes.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Students</p>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Tests Created</p>
            <p className="text-3xl font-bold text-purple-600">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Pending Grading</p>
            <p className="text-3xl font-bold text-orange-600">0</p>
          </div>
        </div>

        {/* Classes */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">My Classes</h2>
            <Link href="/teacher/classes/new">
              <Button className="bg-green-600 hover:bg-green-700">
                + New Class
              </Button>
            </Link>
          </div>
          <div className="divide-y">
            {classes.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No classes yet. Create your first class!</p>
              </div>
            ) : (
              classes.map(cls => (
                <div key={cls.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{cls.title}</h3>
                      <p className="text-sm text-gray-600">Code: {cls.code}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {cls.students?._count?.students || 0} students • {cls.tests?._count?.tests || 0} tests
                      </p>
                    </div>
                    <Link href={`/teacher/classes/${cls.id}`}>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
