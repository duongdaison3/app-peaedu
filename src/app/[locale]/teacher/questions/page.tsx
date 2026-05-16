'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getQuestions, getQuestionFolders } from '@/modules'
import Link from 'next/link'

export default function QuestionBankPage() {
  const t = useTranslations('Teacher')
  const [folders, setFolders] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const userFolders = await getQuestionFolders()
        setFolders(userFolders)

        const userQuestions = await getQuestions({
          folderId: selectedFolder || undefined
        })
        setQuestions(userQuestions)
      } catch (error) {
        console.error('Error loading questions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedFolder])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
            <div className="space-x-2">
              <Button variant="outline">+ New Folder</Button>
              <Link href="/teacher/questions/new">
                <Button className="bg-green-600 hover:bg-green-700">
                  + New Question
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Folders */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-gray-900 mb-4">Folders</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`block w-full text-left px-3 py-2 rounded ${
                    selectedFolder === null ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                >
                  All Questions
                </button>
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`block w-full text-left px-3 py-2 rounded text-sm ${
                      selectedFolder === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {folder.title}
                    <span className="text-xs text-gray-500 ml-2">({folder._count.questions})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main - Questions List */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : questions.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">No questions in this folder</p>
                <Link href="/teacher/questions/new">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Create a Question
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map(question => (
                  <div key={question.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{question.title || 'Untitled'}</h4>
                        <p className="text-gray-600 text-sm mt-1">{question.content}</p>
                        <div className="mt-3 flex gap-2 text-xs">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{question.type}</span>
                          {question.skill && <span className="px-2 py-1 bg-green-100 text-green-700 rounded">{question.skill}</span>}
                          {question.difficulty && <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">{question.difficulty}</span>}
                        </div>
                      </div>
                      <div className="space-x-2 ml-4">
                        <Link href={`/teacher/questions/${question.id}/edit`}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </Link>
                        <Button variant="outline" size="sm">Delete</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
