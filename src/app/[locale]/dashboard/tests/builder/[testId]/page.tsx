'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Save, Eye, Settings } from 'lucide-react'
import { DraggableList } from '@/components/test-builder/draggable-list'
import { SectionSettings } from '@/components/test-builder/section-settings'
import { QuestionSelector } from '@/components/test-builder/question-selector'
import { QuestionCard } from '@/components/test-builder/question-card'
import { TestPreview } from '@/components/test-builder/test-preview'
import {
  getTest,
  createTestSection,
  updateTestSection,
  deleteTestSection,
  addQuestionToSection,
  removeQuestionFromSection,
  reorderQuestionsInSection,
  reorderSectionsInTest,
  updateTestQuestionScore,
  updateTest,
} from '@/modules/test/actions'

interface TestData {
  id: string
  title: string
  description?: string
  sections: any[]
}

export default function TestBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const testId = params.testId as string

  const [test, setTest] = useState<TestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [showQuestionSelector, setShowQuestionSelector] = useState<string | null>(null)

  useEffect(() => {
    loadTest()
  }, [testId])

  const loadTest = async () => {
    try {
      setLoading(true)
      const data = await getTest(testId)
      setTest(data as any)
    } catch (error) {
      console.error('Error loading test:', error)
      alert('Error loading test')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSection = async () => {
    if (!test) return

    try {
      const newSection = await createTestSection({
        testId,
        title: `Section ${test.sections.length + 1}`
      })

      setTest({
        ...test,
        sections: [...test.sections, newSection]
      })
    } catch (error) {
      console.error('Error adding section:', error)
      alert('Error adding section')
    }
  }

  const handleUpdateSection = async (sectionId: string, data: any) => {
    try {
      const updated = await updateTestSection(sectionId, data)
      setTest({
        ...test!,
        sections: test!.sections.map((s) =>
          s.id === sectionId ? updated : s
        )
      })
      setEditingSection(null)
    } catch (error) {
      console.error('Error updating section:', error)
      alert('Error updating section')
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Delete this section? Questions will not be deleted.')) return

    try {
      await deleteTestSection(sectionId)
      setTest({
        ...test!,
        sections: test!.sections.filter((s) => s.id !== sectionId)
      })
    } catch (error) {
      console.error('Error deleting section:', error)
      alert('Error deleting section')
    }
  }

  const handleAddQuestion = async (sectionId: string, questionId: string, score?: number) => {
    try {
      const newQuestion = await addQuestionToSection({
        sectionId,
        questionId,
        customScore: score
      })

      setTest({
        ...test!,
        sections: test!.sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                questions: [...s.questions, newQuestion]
              }
            : s
        )
      })
      setShowQuestionSelector(null)
    } catch (error) {
      console.error('Error adding question:', error)
      alert('Error adding question')
    }
  }

  const handleRemoveQuestion = async (sectionId: string, testQuestionId: string) => {
    if (!confirm('Remove this question?')) return

    try {
      await removeQuestionFromSection(testQuestionId)
      setTest({
        ...test!,
        sections: test!.sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                questions: s.questions.filter((q: any) => q.id !== testQuestionId)
              }
            : s
        )
      })
    } catch (error) {
      console.error('Error removing question:', error)
      alert('Error removing question')
    }
  }

  const handleReorderQuestions = async (sectionId: string, questionIds: string[]) => {
    try {
      await reorderQuestionsInSection(sectionId, questionIds)
      setTest({
        ...test!,
        sections: test!.sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                questions: questionIds.map((id) =>
                  s.questions.find((q: any) => q.id === id)
                )
              }
            : s
        )
      })
    } catch (error) {
      console.error('Error reordering questions:', error)
    }
  }

  const handleReorderSections = async (sectionIds: string[]) => {
    try {
      await reorderSectionsInTest(testId, sectionIds)
      setTest({
        ...test!,
        sections: sectionIds.map((id) =>
          test!.sections.find((s) => s.id === id)
        )
      })
    } catch (error) {
      console.error('Error reordering sections:', error)
    }
  }

  const handleUpdateScore = async (testQuestionId: string, score: number) => {
    try {
      await updateTestQuestionScore(testQuestionId, score)
      // Update local state
      setTest({
        ...test!,
        sections: test!.sections.map((s) => ({
          ...s,
          questions: s.questions.map((q: any) =>
            q.id === testQuestionId ? { ...q, customScore: score } : q
          )
        }))
      })
    } catch (error) {
      console.error('Error updating score:', error)
    }
  }

  const handleSave = async () => {
    if (!test) return

    try {
      setSaving(true)
      await updateTest(testId, {
        title: test.title,
        description: test.description
      })
      alert('Test saved successfully!')
    } catch (error) {
      console.error('Error saving test:', error)
      alert('Error saving test')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading test builder...</p>
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Test not found</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              {test.title}
            </h1>
            {test.description && (
              <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                {test.description}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-700"
            >
              <Eye size={18} />
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <DraggableList
            items={test.sections}
            onReorder={handleReorderSections}
            itemIdField="id"
            renderItem={(section) => (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden flex-1">
                {/* Section Header */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                      {section.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {section.questions?.length || 0} questions
                      {section.durationMinutes && ` • ${section.durationMinutes} min`}
                    </p>
                  </div>

                  <button
                    onClick={() => setEditingSection(
                      editingSection === section.id ? null : section.id
                    )}
                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                  >
                    <Settings size={18} className="text-blue-600 dark:text-blue-400" />
                  </button>
                </div>

                {/* Section Settings */}
                {editingSection === section.id && (
                  <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-gray-50 dark:bg-gray-900/50">
                    <SectionSettings
                      sectionId={section.id}
                      title={section.title}
                      skill={section.skill}
                      durationMinutes={section.durationMinutes}
                      onUpdate={(data) => handleUpdateSection(section.id, data)}
                      onClose={() => setEditingSection(null)}
                    />
                  </div>
                )}

                {/* Questions */}
                <div className="p-4 space-y-3">
                  {section.questions?.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500">
                      No questions added yet
                    </div>
                  ) : (
                    <DraggableList
                      items={section.questions}
                      onReorder={(qIds) => handleReorderQuestions(section.id, qIds)}
                      itemIdField="id"
                      renderItem={(tq) => (
                        <QuestionCard
                          question={tq.question}
                          score={tq.customScore}
                          onUpdateScore={(score) => handleUpdateScore(tq.id, score)}
                          onDelete={() =>
                            handleRemoveQuestion(section.id, tq.id)
                          }
                        />
                      )}
                    />
                  )}

                  {/* Add Question Button */}
                  <button
                    onClick={() => setShowQuestionSelector(section.id)}
                    className="w-full py-2 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-400 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Plus size={18} className="mx-auto" />
                  </button>
                </div>

                {/* Delete Section */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Delete Section
                  </button>
                </div>
              </div>
            )}
          />

          {/* Add Section Button */}
          <button
            onClick={handleAddSection}
            className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
          >
            <Plus size={20} className="mx-auto mb-2" />
            Add Section
          </button>
        </div>
      </div>

      {/* Question Selector Modal */}
      {showQuestionSelector && (
        <QuestionSelector
          onSelectQuestion={(qId, score) =>
            handleAddQuestion(showQuestionSelector, qId, score)
          }
          onClose={() => setShowQuestionSelector(null)}
          excludeIds={test.sections
            .find((s) => s.id === showQuestionSelector)
            ?.questions?.map((q: any) => q.questionId) || []}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <TestPreview test={test} onClose={() => setShowPreview(false)} />
      )}
    </div>
  )
}
