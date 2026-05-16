'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { TestTimer } from '@/components/test-engine/test-timer'
import { TestProgressBar } from '@/components/test-engine/test-progress-bar'
import { TestSidebar } from '@/components/test-engine/test-sidebar'
import { TestQuestionDisplay } from '@/components/test-engine/test-question-display'
import { AntiCopyProtection } from '@/components/test-engine/anti-copy-protection'
import { FullscreenButton } from '@/components/test-engine/fullscreen-button'
import {
  bulkSaveAnswerDrafts,
  forceSubmitTestAttempt,
  getTestAttemptDetails,
  getTestAttemptProgress
} from '@/modules/test/actions'

interface Question {
  id: string
  title: string
  content: string
  type: string
  options?: Array<{ id: string; text: string; isCorrect?: boolean }>
  media?: Array<{ type: string; url: string }>
  score: number
  skill?: string
}

interface Section {
  id: string
  title: string
  durationMinutes?: number
  randomize?: boolean
  questions: Question[]
}

interface Attempt {
  id: string
  test: {
    id: string
    title: string
    description: string
    sections: Section[]
  }
  answers: Array<{ questionId: string; answerJson?: any; answerText?: string }>
}

function hasAnswerValue(answer: any) {
  return Boolean(answer?.selectedId || answer?.selectedValue || answer?.text || answer?.audioUrl)
}

export default function TestAttemptPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.attemptId as string
  const containerRef = useRef<HTMLDivElement>(null)

  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [answers, setAnswers] = useState<Map<string, any>>(new Map())
  const [currentSectionId, setCurrentSectionId] = useState('')
  const [currentQuestionId, setCurrentQuestionId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [progress, setProgress] = useState({ answered: 0, total: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [violationCount, setViolationCount] = useState(0)

  const currentSection = useMemo(
    () => attempt?.test.sections.find(section => section.id === currentSectionId),
    [attempt, currentSectionId]
  )

  const currentQuestion = useMemo(
    () => currentSection?.questions.find(question => question.id === currentQuestionId),
    [currentSection, currentQuestionId]
  )

  const currentAnswer = answers.get(currentQuestionId)

  const totalDuration = useMemo(() => {
    if (!attempt) return 0
    return attempt.test.sections.reduce((sum, section) => sum + (section.durationMinutes || 0), 0)
  }, [attempt])

  const serializeAnswers = () => {
    const payload: Array<{ questionId: string; answerJson?: Record<string, any>; answerText?: string }> = []

    for (const [questionId, answer] of answers.entries()) {
      if (!hasAnswerValue(answer)) continue
      payload.push({
        questionId,
        answerJson: answer?.selectedId || answer?.selectedValue || answer?.audioUrl ? { ...answer } : undefined,
        answerText: answer?.text || undefined
      })
    }

    return payload
  }

  useEffect(() => {
    const loadAttempt = async () => {
      try {
        const data = (await getTestAttemptDetails(attemptId)) as any
        setAttempt(data as Attempt)

        const firstSection = data.test.sections[0]
        if (firstSection) {
          setCurrentSectionId(firstSection.id)
          setCurrentQuestionId(firstSection.questions[0]?.id || '')
        }

        const restoredAnswers = new Map<string, any>()
        data.answers.forEach((answer: any) => {
          if (!answer.answerJson && !answer.answerText) return
          restoredAnswers.set(answer.questionId, {
            ...(answer.answerJson || {}),
            text: answer.answerText || answer.answerJson?.text
          })
        })
        setAnswers(restoredAnswers)

        const progressData = await getTestAttemptProgress(attemptId)
        setProgress({
          answered: progressData.answeredQuestions,
          total: progressData.totalQuestions
        })
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load test')
        router.push('/dashboard/tests')
      }
    }

    void loadAttempt()
  }, [attemptId, router])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        handleNextQuestion()
      }
      if (event.key === 'ArrowLeft') {
        handlePreviousQuestion()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [attempt, currentQuestionId, currentSectionId])

  useEffect(() => {
    const timer = setTimeout(async () => {
      const payload = serializeAnswers()
      if (payload.length === 0) return

      setIsSaving(true)
      try {
        await bulkSaveAnswerDrafts(attemptId, payload)
      } catch (error: any) {
        toast.error(error?.message || 'Lỗi lưu tự động')
      } finally {
        setIsSaving(false)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [answers, attemptId])

  const handleAnswerChange = (answer: any) => {
    const hadAnswer = hasAnswerValue(answers.get(currentQuestionId))
    const hasAnswerNow = hasAnswerValue(answer)

    setAnswers(prev => {
      const next = new Map(prev)
      next.set(currentQuestionId, answer)
      return next
    })

    if (!hadAnswer && hasAnswerNow) {
      setProgress(prev => ({
        ...prev,
        answered: Math.min(prev.total, prev.answered + 1)
      }))
    }
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    try {
      const payload = serializeAnswers()
      if (payload.length > 0) {
        await bulkSaveAnswerDrafts(attemptId, payload)
      }

      await forceSubmitTestAttempt(attemptId)
      toast.success('Nộp bài thành công')
      router.push(`/dashboard/test-results/${attemptId}`)
    } catch (error: any) {
      toast.error(error?.message || 'Không thể nộp bài')
    } finally {
      setIsSaving(false)
      setShowSubmitDialog(false)
    }
  }

  const handleSectionTimeout = async () => {
    if (!attempt || !currentSection) return

    toast.error('Hết giờ phần hiện tại, đang chuyển phần tiếp theo')

    const currentIndex = attempt.test.sections.findIndex(section => section.id === currentSection.id)
    if (currentIndex < 0) return

    if (currentIndex >= attempt.test.sections.length - 1) {
      await handleSubmit()
      return
    }

    const next = attempt.test.sections[currentIndex + 1]
    setCurrentSectionId(next.id)
    setCurrentQuestionId(next.questions[0]?.id || '')
  }

  const handleNextQuestion = () => {
    if (!attempt) return

    for (let sectionIndex = 0; sectionIndex < attempt.test.sections.length; sectionIndex += 1) {
      const section = attempt.test.sections[sectionIndex]
      const questionIndex = section.questions.findIndex(question => question.id === currentQuestionId)

      if (section.id === currentSectionId && questionIndex < section.questions.length - 1) {
        setCurrentQuestionId(section.questions[questionIndex + 1].id)
        return
      }

      if (section.id === currentSectionId && sectionIndex < attempt.test.sections.length - 1) {
        const nextSection = attempt.test.sections[sectionIndex + 1]
        setCurrentSectionId(nextSection.id)
        setCurrentQuestionId(nextSection.questions[0]?.id || '')
        return
      }
    }
  }

  const handlePreviousQuestion = () => {
    if (!attempt) return

    for (let sectionIndex = 0; sectionIndex < attempt.test.sections.length; sectionIndex += 1) {
      const section = attempt.test.sections[sectionIndex]
      const questionIndex = section.questions.findIndex(question => question.id === currentQuestionId)

      if (section.id === currentSectionId && questionIndex > 0) {
        setCurrentQuestionId(section.questions[questionIndex - 1].id)
        return
      }

      if (section.id === currentSectionId && sectionIndex > 0) {
        const prevSection = attempt.test.sections[sectionIndex - 1]
        setCurrentSectionId(prevSection.id)
        setCurrentQuestionId(prevSection.questions[prevSection.questions.length - 1]?.id || '')
        return
      }
    }
  }

  if (!attempt) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-zinc-600 dark:text-zinc-400">Đang tải bài thi...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AntiCopyProtection
        maxViolations={4}
        onViolation={(reason, count) => {
          setViolationCount(count)
          if (reason === 'tab-hidden' || reason === 'window-blur') {
            toast.warning(`Phát hiện rời khỏi tab (${count}/4)`)
          }
        }}
        onMaxViolations={async () => {
          toast.error('Phát hiện quá nhiều vi phạm, hệ thống sẽ tự nộp bài')
          await handleSubmit()
        }}
      />

      <div ref={containerRef} className="flex h-screen overflow-hidden bg-white dark:bg-zinc-950">
        <div
          className={`shrink-0 overflow-hidden border-r border-zinc-200 transition-all dark:border-zinc-800 ${
            sidebarOpen ? 'w-64' : 'w-0'
          }`}
        >
          {sidebarOpen && (
            <TestSidebar
              sections={attempt.test.sections.map(section => ({
                id: section.id,
                title: section.title,
                questions: section.questions.map((question, index) => ({
                  id: question.id,
                  title: `Câu ${index + 1}`,
                  answered: hasAnswerValue(answers.get(question.id))
                }))
              }))}
              currentSectionId={currentSectionId}
              currentQuestionId={currentQuestionId}
              onSectionSelect={sectionId => {
                setCurrentSectionId(sectionId)
                const firstQuestion = attempt.test.sections.find(item => item.id === sectionId)?.questions[0]
                if (firstQuestion) setCurrentQuestionId(firstQuestion.id)
              }}
              onQuestionSelect={(questionId, sectionId) => {
                setCurrentSectionId(sectionId)
                setCurrentQuestionId(questionId)
              }}
              onClose={() => setSidebarOpen(false)}
            />
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(prev => !prev)}
                className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 className="truncate text-xl font-bold text-zinc-900 dark:text-white">{attempt.test.title}</h1>
            </div>

            <div className="flex items-center gap-4">
              <TestProgressBar answered={progress.answered} total={progress.total} />

              {currentSection?.durationMinutes && currentSection.durationMinutes > 0 ? (
                <TestTimer durationMinutes={currentSection.durationMinutes} onTimeUp={handleSectionTimeout} />
              ) : totalDuration > 0 ? (
                <TestTimer durationMinutes={totalDuration} onTimeUp={handleSubmit} />
              ) : null}

              <FullscreenButton containerRef={containerRef as React.RefObject<HTMLDivElement>} />

              <Button variant="outline" size="sm" onClick={() => setShowSubmitDialog(true)} disabled={isSaving}>
                <LogOut size={16} className="mr-2" />
                Nộp bài
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mb-4 block md:hidden">
              <div className="flex gap-2 overflow-x-auto">
                {attempt.test.sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setCurrentSectionId(section.id)
                      setCurrentQuestionId(section.questions[0]?.id || '')
                    }}
                    className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${
                      currentSectionId === section.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </div>

            {currentQuestion && (
              <div className="mx-auto max-w-2xl">
                <TestQuestionDisplay
                  question={currentQuestion as any}
                  index={currentSection?.questions.findIndex(question => question.id === currentQuestion.id) || 0}
                  total={currentSection?.questions.length || 0}
                  answer={currentAnswer}
                  onAnswerChange={handleAnswerChange}
                />

                <div className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  Số lần vi phạm anti-cheat: {violationCount}/4
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Button variant="outline" onClick={handlePreviousQuestion}>
              ← Câu trước
            </Button>

            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {isSaving && <span className="font-semibold text-blue-500">Đang lưu...</span>}
            </div>

            <Button onClick={handleNextQuestion}>Câu sau →</Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Xác nhận nộp bài</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn vừa trả lời {progress.answered} / {progress.total} câu. Sau khi nộp bài, bạn không thể chỉnh sửa lại.
          </AlertDialogDescription>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel disabled={isSaving}>Quay lại</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSaving} className="bg-red-500 hover:bg-red-600">
              {isSaving ? 'Đang nộp...' : 'Nộp bài'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
