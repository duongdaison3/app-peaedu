'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getTests } from '@/modules'
import Link from 'next/link'

export default function TeacherTestsPage() {
  const t = useTranslations('Teacher')
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTests = async () => {
      try {
        const userTests = await getTests()
        setTests(userTests)
      } catch (error) {
        console.error('Error loading tests:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTests()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">My Tests</h1>
            <Link href="/teacher/tests/new">
              <Button className="bg-green-600 hover:bg-green-700">
                + Create Test
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">No tests created yet</p>
                <Link href="/teacher/tests/new">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Create Your First Test
                  </Button>
                </Link>
              </div>
            ) : (
              tests.map(test => (
                <div key={test.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{test.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{test.description}</p>
                      <div className="mt-4 space-y-2 text-sm text-gray-500">
                        <p>Sections: {test.sections?._count || 0}</p>
                        <p>Attempts: {test.attempts?._count || 0}</p>
                        {test.class && <p>Class: {test.class.title}</p>}
                      </div>
                    </div>
                    <div className="space-x-2">
                      <Link href={`/teacher/tests/${test.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/teacher/tests/${test.id}/results`}>
                        <Button variant="outline" size="sm">
                          Results
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
