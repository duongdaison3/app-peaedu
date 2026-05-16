'use client'

import { useState, useEffect } from 'react'
import { Edit2, Trash2 } from 'lucide-react'

interface QuestionCardProps {
  question: any
  score?: number
  onUpdateScore: (score: number) => void
  onDelete: () => void
}

export function QuestionCard({
  question,
  score,
  onUpdateScore,
  onDelete
}: QuestionCardProps) {
  const [editingScore, setEditingScore] = useState(false)
  const [scoreValue, setScoreValue] = useState(score?.toString() || question.score?.toString() || '1')

  const handleSaveScore = () => {
    onUpdateScore(parseFloat(scoreValue) || 1)
    setEditingScore(false)
  }

  return (
    <div className="p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-medium text-zinc-900 dark:text-white text-sm">
            {question.title || 'Untitled Question'}
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
            {question.content}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded">
              {question.type}
            </span>
            {question.skill && (
              <span className="inline-block px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded">
                {question.skill}
              </span>
            )}
            {question.difficulty && (
              <span
                className={`inline-block px-2 py-0.5 text-xs rounded ${
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
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editingScore ? (
            <div className="flex gap-1">
              <input
                type="number"
                min="0"
                step="0.5"
                value={scoreValue}
                onChange={(e) => setScoreValue(e.target.value)}
                className="w-16 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
              />
              <button
                onClick={handleSaveScore}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          ) : (
            <div
              onClick={() => setEditingScore(true)}
              className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 rounded text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              Score: {scoreValue}
            </div>
          )}

          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
          >
            <Trash2 size={16} className="text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  )
}
