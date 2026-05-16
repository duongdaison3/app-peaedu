'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface TestPreviewProps {
  test: any
  onClose?: () => void
}

export function TestPreview({ test, onClose }: TestPreviewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const totalQuestions = test.sections?.reduce(
    (sum: number, s: any) => sum + (s.questions?.length || 0),
    0
  ) || 0

  const totalScore = test.sections?.reduce((sum: number, section: any) => {
    return (
      sum +
      (section.questions?.reduce((sectionSum: number, q: any) => {
        return sectionSum + (q.customScore || q.question?.score || 1)
      }, 0) || 0)
    )
  }, 0) || 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-950 rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-950">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {test.title}
              </h2>
              {test.description && (
                <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                  {test.description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              ✕
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Sections</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">
                {test.sections?.length || 0}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Questions</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">
                {totalQuestions}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Total Score</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">
                {totalScore}
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="p-6 space-y-4">
          {test.sections?.map((section: any, idx: number) => (
            <div key={section.id} className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between"
              >
                <div className="text-left">
                  <h3 className="font-semibold text-zinc-900 dark:text-white">
                    Section {idx + 1}: {section.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {section.questions?.length || 0} questions
                    {section.durationMinutes && ` • ${section.durationMinutes} min`}
                    {section.skill && ` • ${section.skill}`}
                  </p>
                </div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  {expandedSections.has(section.id) ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </div>
              </button>

              {/* Questions */}
              {expandedSections.has(section.id) && (
                <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="space-y-3">
                    {section.questions?.map((tq: any, qIdx: number) => (
                      <div
                        key={tq.id}
                        className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-zinc-900 dark:text-white text-sm">
                              Q{qIdx + 1}. {tq.question?.title || 'Untitled'}
                            </p>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                              {tq.question?.content}
                            </p>
                          </div>
                          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 px-2 py-1 rounded whitespace-nowrap">
                            {tq.customScore || tq.question?.score || 1}pt
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}
