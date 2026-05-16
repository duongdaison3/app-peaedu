'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/modules/auth/actions'
import { getClasses } from '@/modules/course/actions'
import { getTests } from '@/modules/test/actions'
import { getStudentPerformance } from '@/modules/analytics/actions'
import { BarChart3, BookOpen, Users, ClipboardList } from 'lucide-react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 ${className}`}>
      {children}
    </div>
  )
}

export default function DashboardPage() {
  const t = useTranslations()
  const [stats, setStats] = useState({
    classes: 0,
    tests: 0,
    students: 0,
    avgScore: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) return

        if (['teacher', 'academic_manager', 'super_admin'].includes(user.role)) {
          const classes = await getClasses()
          const tests = await getTests()
          
          let totalStudents = 0
          classes.forEach(cls => {
            totalStudents += (cls as any)._count?.students || 0
          })

          setStats({
            classes: classes.length,
            tests: tests.length,
            students: totalStudents,
            avgScore: 0,
          })
        } else if (user.role === 'student') {
          const performance = await getStudentPerformance(user.id)
          setStats({
            classes: 0,
            tests: performance.completedAttempts || 0,
            students: 0,
            avgScore: performance.averageScore || 0,
          })
        }
      } catch (error) {
        console.error('Error loading dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-zinc-950 dark:text-white">Dashboard</h1>

      {/* Quick stats */}
      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Classes</p>
              <p className="mt-2 text-3xl font-bold text-zinc-950 dark:text-white">{stats.classes}</p>
            </div>
            <BookOpen className="text-zinc-300 dark:text-zinc-700" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Tests Created</p>
              <p className="mt-2 text-3xl font-bold text-zinc-950 dark:text-white">{stats.tests}</p>
            </div>
            <ClipboardList className="text-zinc-300 dark:text-zinc-700" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Students</p>
              <p className="mt-2 text-3xl font-bold text-zinc-950 dark:text-white">{stats.students}</p>
            </div>
            <Users className="text-zinc-300 dark:text-zinc-700" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Avg Score</p>
              <p className="mt-2 text-3xl font-bold text-zinc-950 dark:text-white">{Math.round(stats.avgScore)}%</p>
            </div>
            <BarChart3 className="text-zinc-300 dark:text-zinc-700" size={32} />
          </div>
        </Card>
      </div>

      {/* Recent activity placeholder */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-white">Recent Activity</h2>
        <p className="text-zinc-600 dark:text-zinc-400">Activity log will appear here</p>
      </Card>
    </div>
  )
}
