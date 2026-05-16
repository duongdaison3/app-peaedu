'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getCurrentUser, getStudentClasses } from '@/modules'
import Link from 'next/link'

export default function StudentDashboard() {
  const t = useTranslations('Student')
  const [classes, setClasses] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        
        const userClasses = await getStudentClasses()
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
                {t('welcome')}, {user?.fullName || 'Student'}
              </h1>
              <p className="text-gray-600 mt-2">Here's your learning dashboard</p>
            </div>
            <Link href="/placement">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Take Placement Test
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Classes Enrolled</p>
            <p className="text-3xl font-bold text-blue-600">{classes.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Tests Completed</p>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Average Score</p>
            <p className="text-3xl font-bold text-purple-600">--</p>
          </div>
        </div>

        {/* Classes */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">My Classes</h2>
          </div>
          <div className="divide-y">
            {classes.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No classes yet. Join a class using the code!</p>
                <input
                  type="text"
                  placeholder="Enter class code"
                  className="mt-4 px-4 py-2 border border-gray-300 rounded-lg"
                />
                <Button className="ml-2 bg-blue-600 hover:bg-blue-700">
                  Join Class
                </Button>
              </div>
            ) : (
              classes.map(cls => (
                <div key={cls.id} className="p-6 hover:bg-gray-50 cursor-pointer">
                  <h3 className="font-semibold text-gray-900">{cls.title}</h3>
                  <p className="text-sm text-gray-600">{cls.course?.title}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    {cls.tests?.length || 0} tests
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
