'use client'

import { useState, useEffect } from 'react'
import { getQuestions } from '@/modules/assessment/actions'

interface SelectableQuestion {
  id: string
  score: number
}

interface QuestionSelectorProps {
  onSelectQuestion: (questionId: string, score?: number) => void
  onSelectQuestions?: (questions: SelectableQuestion[]) => void | Promise<void>
  onClose?: () => void
  excludeIds?: string[]
}

export function QuestionSelector({
  onSelectQuestion,
  onSelectQuestions,
  onClose,
  excludeIds = []
}: QuestionSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScore, setSelectedScore] = useState('1')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const data = await getQuestions()
      setQuestions(data.filter((q) => !excludeIds.includes(q.id)))
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuestions = questions.filter((q) => {
    const lowerQuery = searchQuery.toLowerCase()
    return (
      q.title?.toLowerCase().includes(lowerQuery) ||
      q.content?.toLowerCase?.().includes(lowerQuery)
    )
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-950 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-3">
            Add Question
          </h3>
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
          />
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-zinc-500">Loading...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">No questions found</div>
          ) : (
            filteredQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(q.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds((s) => [...s, q.id])
                            else setSelectedIds((s) => s.filter((id) => id !== q.id))
                          }}
                        />

                        <div className="flex-1">
                          <p className="font-medium text-zinc-900 dark:text-white text-sm">
                            {q.title || 'Untitled'}
                          </p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1">
                            {q.content}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded">
                              {q.type}
                            </span>
                            {q.skill && (
                              <span className="inline-block px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded">
                                {q.skill}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => onSelectQuestion(q.id, parseFloat(selectedScore))}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm whitespace-nowrap"
                        >
                          Add
                        </button>
                      </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 justify-end items-center">
          <div className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">Selected: {selectedIds.length}</div>
          <button
            onClick={async () => {
              const selectedQuestions = selectedIds.map((id) => ({
                id,
                score: parseFloat(selectedScore)
              }))

              if (onSelectQuestions) {
                await onSelectQuestions(selectedQuestions)
              } else {
                for (const selectedQuestion of selectedQuestions) {
                  await onSelectQuestion(selectedQuestion.id, selectedQuestion.score)
                }
              }
              setSelectedIds([])
              onClose?.()
            }}
            disabled={selectedIds.length === 0}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            Add Selected ({selectedIds.length})
          </button>

          <button
            onClick={onClose}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
