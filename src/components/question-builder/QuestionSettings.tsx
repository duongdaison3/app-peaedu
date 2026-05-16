'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { QUESTION_TYPE_CONFIG, getQuestionTypesByCategory, getQuestionTypeLabel } from '@/lib/question-types'
import type { QuestionType, QuestionSkill, QuestionDifficulty } from '@prisma/client'

interface QuestionSettingsProps {
  type: QuestionType
  skill: QuestionSkill
  difficulty: QuestionDifficulty
  tags: string[]
  title?: string
  onTypeChange: (type: QuestionType) => void
  onSkillChange: (skill: QuestionSkill) => void
  onDifficultyChange: (difficulty: QuestionDifficulty) => void
  onTagsChange: (tags: string[]) => void
  onTitleChange?: (title: string) => void
}

const QUESTION_TYPES_BY_CATEGORY = {
  Basic: getQuestionTypesByCategory('basic'),
  'Speaking & Writing': getQuestionTypesByCategory('speaking_writing'),
  'Reading': getQuestionTypesByCategory('reading'),
  'Listening': getQuestionTypesByCategory('listening')
}

const SKILLS: QuestionSkill[] = ['listening', 'reading', 'writing', 'speaking', 'grammar', 'vocabulary']
const DIFFICULTIES: QuestionDifficulty[] = ['easy', 'medium', 'hard']
const AVAILABLE_TAGS = ['vocabulary', 'grammar', 'practice', 'exam', 'listening', 'reading', 'writing', 'speaking', 'pronunciation', 'fluency']

export function QuestionSettings({
  type,
  skill,
  difficulty,
  tags,
  title = '',
  onTypeChange,
  onSkillChange,
  onDifficultyChange,
  onTagsChange,
  onTitleChange
}: QuestionSettingsProps) {
  const typeConfig = QUESTION_TYPE_CONFIG[type]

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Question Settings</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Configure question type and metadata</p>
      </div>

      {/* Question Type */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
          Question Type *
        </label>
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value as QuestionType)}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {Object.entries(QUESTION_TYPES_BY_CATEGORY).map(([category, types]) => (
            <optgroup key={category} label={category}>
              {(types as QuestionType[]).map((t) => (
                <option key={t} value={t}>
                  {getQuestionTypeLabel(t)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
          {typeConfig?.description}
        </p>
      </div>

      {/* Title (optional) */}
      {onTitleChange && (
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Q1 - Reading Comprehension"
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      )}

      {/* Skill & Difficulty */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Skill
          </label>
          <select
            value={skill}
            onChange={(e) => onSkillChange(e.target.value as QuestionSkill)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {SKILLS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as QuestionDifficulty)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
          Tags (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                if (tags.includes(tag)) {
                  onTagsChange(tags.filter((t) => t !== tag))
                } else {
                  onTagsChange([...tags, tag])
                }
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                tags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
