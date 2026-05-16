'use client'

import { useState, useEffect } from 'react'
import { Search, Plus } from 'lucide-react'
import { FolderTree } from '@/components/question-bank/folder-tree'
import { QuestionList } from '@/components/question-bank/question-list'
import { QuestionForm } from '@/components/question-bank/question-form'
import { Pagination } from '@/components/question-bank/pagination'
import { getQuestions, deleteQuestion, duplicateQuestion } from '@/modules/assessment/actions'
import type { QuestionSkill, QuestionDifficulty, QuestionType } from '@prisma/client'

const ITEMS_PER_PAGE = 10

export default function QuestionBankPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedSkill, setSelectedSkill] = useState<QuestionSkill | ''>('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuestionDifficulty | ''>('')
  const [selectedType, setSelectedType] = useState<QuestionType | ''>('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadQuestions()
  }, [selectedFolderId])

  useEffect(() => {
    applyFilters()
    setCurrentPage(1)
  }, [searchQuery, selectedTags, selectedSkill, selectedDifficulty, selectedType, questions])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const data = await getQuestions({
        folderId: selectedFolderId || undefined,
        skill: selectedSkill as QuestionSkill | undefined,
        difficulty: selectedDifficulty as QuestionDifficulty | undefined,
        type: selectedType as QuestionType | undefined
      })
      setQuestions(data)
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = questions

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (q) =>
          q.title?.toLowerCase().includes(query) ||
          q.content.toLowerCase().includes(query)
      )
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((q) =>
        selectedTags.some((tag) =>
          q.tags?.some((t: any) => t.tag.name === tag)
        )
      )
    }

    setFilteredQuestions(filtered)
  }

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteQuestion(questionId)
      await loadQuestions()
    } catch (error) {
      console.error('Error deleting question:', error)
      alert('Error deleting question')
    }
  }

  const handleDuplicateQuestion = async (questionId: string) => {
    try {
      await duplicateQuestion(questionId, selectedFolderId || undefined)
      await loadQuestions()
    } catch (error) {
      console.error('Error duplicating question:', error)
      alert('Error duplicating question')
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedQuestions = filteredQuestions.slice(
    startIdx,
    startIdx + ITEMS_PER_PAGE
  )

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-zinc-950 dark:text-white">
            Question Bank
          </h1>
          <button
            onClick={() => {
              setEditingQuestion(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={18} />
            New Question
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sidebar - Folder Tree */}
        <div className="w-64 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <FolderTree
            selectedFolderId={selectedFolderId}
            onFolderSelect={setSelectedFolderId}
            onRefresh={loadQuestions}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Filters */}
          <div className="mb-4 p-4 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-4 gap-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as QuestionType | '')}
                className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm"
              >
                <option value="">All Types</option>
                <option value="mcq">MCQ</option>
                <option value="fill_in_blank">Fill in Blank</option>
                <option value="essay">Essay</option>
                <option value="matching">Matching</option>
                <option value="true_false">True/False</option>
              </select>

              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value as QuestionSkill | '')}
                className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm"
              >
                <option value="">All Skills</option>
                <option value="listening">Listening</option>
                <option value="reading">Reading</option>
                <option value="writing">Writing</option>
                <option value="speaking">Speaking</option>
                <option value="grammar">Grammar</option>
                <option value="vocabulary">Vocabulary</option>
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as QuestionDifficulty | '')}
                className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm"
              >
                <option value="">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedTags([])
                  setSelectedSkill('')
                  setSelectedDifficulty('')
                  setSelectedType('')
                }}
                className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-sm"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="flex-1 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
            <QuestionList
              questions={paginatedQuestions}
              onEdit={(q) => {
                setEditingQuestion(q)
                setShowForm(true)
              }}
              onDelete={handleDeleteQuestion}
              onDuplicate={handleDuplicateQuestion}
              loading={loading}
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}

          {/* Results Info */}
          {!loading && (
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Showing {startIdx + 1}-{Math.min(startIdx + ITEMS_PER_PAGE, filteredQuestions.length)} of{' '}
              {filteredQuestions.length} questions
            </div>
          )}
        </div>
      </div>

      {/* Question Form Modal */}
      {showForm && (
        <QuestionForm
          folderId={selectedFolderId || undefined}
          question={editingQuestion}
          onSuccess={() => {
            loadQuestions()
            setShowForm(false)
            setEditingQuestion(null)
          }}
          onClose={() => {
            setShowForm(false)
            setEditingQuestion(null)
          }}
        />
      )}
    </div>
  )
}
