'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface Section {
  id: string
  title: string
  questions: Array<{ id: string; title: string; answered: boolean }>
}

interface TestSidebarProps {
  sections: Section[]
  currentSectionId: string
  currentQuestionId: string
  onSectionSelect: (sectionId: string) => void
  onQuestionSelect: (questionId: string, sectionId: string) => void
  onClose?: () => void
}

export function TestSidebar({
  sections,
  currentSectionId,
  currentQuestionId,
  onSectionSelect,
  onQuestionSelect
  ,onClose
}: TestSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([currentSectionId])
  )

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  return (
    <div className="h-full overflow-y-auto bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
      <div className="p-4 space-y-3">
        {/* Mobile close */}
        <div className="flex items-center justify-end md:hidden mb-2">
          <button onClick={() => onClose?.()} className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <ChevronUp size={18} />
          </button>
        </div>
        {sections.map(section => (
          <div key={section.id} className="space-y-1">
            {/* Section Header */}
            <button
              onClick={() => {
                toggleSection(section.id)
                onSectionSelect(section.id)
              }}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-sm font-semibold transition-colors ${
                currentSectionId === section.id
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="truncate">{section.title}</span>
              {expandedSections.has(section.id) ? (
                <ChevronUp size={16} className="shrink-0" />
              ) : (
                <ChevronDown size={16} className="shrink-0" />
              )}
            </button>

            {/* Questions */}
            {expandedSections.has(section.id) && (
              <div className="space-y-1 ml-2">
                {section.questions.map((question, idx) => (
                  <button
                    key={question.id}
                    onClick={() => onQuestionSelect(question.id, section.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded text-xs transition-colors ${
                      currentQuestionId === question.id
                        ? 'bg-blue-500 text-white'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold ${
                        question.answered
                          ? currentQuestionId === question.id
                            ? 'bg-white text-blue-500'
                            : 'bg-green-500 text-white'
                          : currentQuestionId === question.id
                            ? 'bg-white text-blue-500'
                            : 'bg-zinc-300 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="truncate text-left">{question.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
