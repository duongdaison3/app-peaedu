'use client'

import { useState } from 'react'
import { Edit2, Trash2, Copy, Music, Image as ImageIcon } from 'lucide-react'

interface Question {
  id: string
  title?: string
  content: string
  type: string
  skill?: string
  difficulty?: string
  _count?: { options: number }
  media?: Array<{ type: string }>
  tags?: Array<{ tag: { name: string } }>
}

interface QuestionListProps {
  questions: Question[]
  onEdit: (question: Question) => void
  onDelete: (questionId: string) => void
  onDuplicate: (questionId: string) => void
  loading?: boolean
}

export function QuestionList({
  questions,
  onEdit,
  onDelete,
  onDuplicate,
  loading
}: QuestionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-900 rounded-md animate-pulse" />
        ))}
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">No questions found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {questions.map((question) => (
        <div
          key={question.id}
          className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
        >
          <div
            className="p-4 bg-white dark:bg-zinc-950 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
            onClick={() => setExpandedId(expandedId === question.id ? null : question.id)}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded">
                    {question.type}
                  </span>
                  {question.difficulty && (
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        question.difficulty === 'easy'
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                          : question.difficulty === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                      }`}
                    >
                      {question.difficulty}
                    </span>
                  )}
                  {question.skill && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded">
                      {question.skill}
                    </span>
                  )}
                </div>

                <h3 className="font-medium text-zinc-900 dark:text-white mb-1">
                  {question.title || 'Untitled Question'}
                </h3>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {question.content}
                </p>

                <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                  {question._count?.options && (
                    <span>{question._count.options} options</span>
                  )}
                  {question.media && question.media.length > 0 && (
                    <div className="flex items-center gap-1">
                      {question.media.some((m) => m.type === 'audio') && (
                        <Music size={14} />
                      )}
                      {question.media.some((m) => m.type === 'image') && (
                        <ImageIcon size={14} />
                      )}
                    </div>
                  )}
                  {question.tags && question.tags.length > 0 && (
                    <div className="flex gap-1">
                      {question.tags.map((t) => (
                        <span
                          key={t.tag.name}
                          className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-900 rounded text-gray-600 dark:text-gray-400"
                        >
                          {t.tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(question)
                  }}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded"
                  title="Edit"
                >
                  <Edit2 size={16} className="text-zinc-600 dark:text-zinc-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDuplicate(question.id)
                  }}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded"
                  title="Duplicate"
                >
                  <Copy size={16} className="text-zinc-600 dark:text-zinc-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Delete this question?')) {
                      onDelete(question.id)
                    }
                  }}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                  title="Delete"
                >
                  <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>

            {expandedId === question.id && question.content && (
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {question.content}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
