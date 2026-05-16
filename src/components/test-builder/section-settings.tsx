'use client'

import { useState } from 'react'
import { Clock, Shuffle } from 'lucide-react'

interface SectionSettingsProps {
  sectionId: string
  title: string
  skill?: string
  durationMinutes?: number
  randomizeQuestions?: boolean
  randomizeAnswers?: boolean
  onUpdate: (data: {
    title?: string
    skill?: string
    durationMinutes?: number
    randomizeQuestions?: boolean
    randomizeAnswers?: boolean
  }) => void
  onClose?: () => void
}

const SKILLS = [
  'listening',
  'reading',
  'writing',
  'speaking',
  'grammar',
  'vocabulary'
]

export function SectionSettings({
  sectionId,
  title,
  skill,
  durationMinutes,
  randomizeQuestions,
  randomizeAnswers,
  onUpdate,
  onClose
}: SectionSettingsProps) {
  const [formData, setFormData] = useState({
    title,
    skill: skill || '',
    durationMinutes: durationMinutes || '',
    randomizeQuestions: randomizeQuestions || false,
    randomizeAnswers: randomizeAnswers || false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate({
      title: formData.title,
      skill: formData.skill || undefined,
      durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes as any) : undefined,
      randomizeQuestions: formData.randomizeQuestions,
      randomizeAnswers: formData.randomizeAnswers
    })
    onClose?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Section Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Skill
          </label>
          <select
            value={formData.skill}
            onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm"
          >
            <option value="">Select skill...</option>
            {SKILLS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            min="0"
            value={formData.durationMinutes}
            onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
            placeholder="Leave empty for no limit"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.randomizeQuestions}
            onChange={(e) =>
              setFormData({ ...formData, randomizeQuestions: e.target.checked })
            }
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Randomize questions
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.randomizeAnswers}
            onChange={(e) =>
              setFormData({ ...formData, randomizeAnswers: e.target.checked })
            }
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Randomize answer options
          </span>
        </label>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Save
        </button>
      </div>
    </form>
  )
}
