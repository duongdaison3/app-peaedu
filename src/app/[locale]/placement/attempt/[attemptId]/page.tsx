"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TestTimer } from '@/components/test-engine/test-timer'
import { TestProgressBar } from '@/components/test-engine/test-progress-bar'
import { TestSidebar } from '@/components/test-engine/test-sidebar'
import { TestQuestionDisplay } from '@/components/test-engine/test-question-display'
import { AntiCopyProtection } from '@/components/test-engine/anti-copy-protection'
import { FullscreenButton } from '@/components/test-engine/fullscreen-button'

interface Question {
  id: string
  title: string
  content: string
  type: string
  options?: Array<{ id: string; text: string }>
  media?: Array<{ type: string; url: string }>
  score?: number
  skill?: string
}

interface Section {
  id: string
  title: string
  durationMinutes?: number
  questions: Question[]
}

interface Attempt {
  id: string
  test: {
    id: string
    title: string
    description?: string
    sections: Section[]
  }
  answers: Array<{ questionId: string; answerJson?: any; answerText?: string }>
}

function hasAnswerValue(answer: any) {
  return Boolean(answer?.selectedId || answer?.selectedValue || answer?.text || answer?.audioUrl)
}

export default function PublicPlacementAttemptPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.attemptId as string

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [answers, setAnswers] = useState<Map<string, any>>(new Map())
  const [currentSectionId, setCurrentSectionId] = useState('')
  const [currentQuestionId, setCurrentQuestionId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const currentSection = useMemo(() => attempt?.test.sections.find(s => s.id === currentSectionId), [attempt, currentSectionId])
  const currentQuestion = useMemo(() => currentSection?.questions.find(q => q.id === currentQuestionId), [currentSection, currentQuestionId])
  const currentAnswer = answers.get(currentQuestionId)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/placement/attempt/${attemptId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed to load attempt')
        setAttempt(data)

        const firstSection = data.test.sections[0]
        if (firstSection) {
          setCurrentSectionId(firstSection.id)
          setCurrentQuestionId(firstSection.questions[0]?.id || '')
        }

        const restored = new Map<string, any>()
        data.answers.forEach((a: any) => {
          if (!a.answerJson && !a.answerText) return
          restored.set(a.questionId, { ...(a.answerJson || {}), text: a.answerText || a.answerJson?.text })
        })
        setAnswers(restored)
      } catch (err: any) {
        toast.error(err?.message || 'Không thể tải bài thi')
        router.push('/placement')
      }
    }

    void load()
  }, [attemptId, router])

  useEffect(() => {
    const timer = setTimeout(async () => {
      const payload: Array<{ questionId: string; answerJson?: any; answerText?: string }> = []
      for (const [questionId, answer] of answers.entries()) {
        if (!hasAnswerValue(answer)) continue
        payload.push({ questionId, answerJson: answer?.selectedId || answer?.selectedValue || answer?.audioUrl ? { ...answer } : undefined, answerText: answer?.text || undefined })
      }
      if (payload.length === 0) return
      setIsSaving(true)
      try {
        await fetch(`/api/placement/attempt/${attemptId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', answers: payload }) })
      } catch (e) {
        console.error('Autosave failed', e)
      } finally {
        setIsSaving(false)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [answers, attemptId])

  const handleAnswerChange = (answer: any) => {
    setAnswers(prev => {
      const next = new Map(prev)
      next.set(currentQuestionId, answer)
      return next
    })
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    try {
      const payload: Array<{ questionId: string; answerJson?: any; answerText?: string }> = []
      for (const [questionId, answer] of answers.entries()) {
        if (!hasAnswerValue(answer)) continue
        payload.push({ questionId, answerJson: answer?.selectedId || answer?.selectedValue || answer?.audioUrl ? { ...answer } : undefined, answerText: answer?.text || undefined })
      }

      if (payload.length > 0) {
        await fetch(`/api/placement/attempt/${attemptId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', answers: payload }) })
      }

      await fetch(`/api/placement/attempt/${attemptId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'submit' }) })
      toast.success('Nộp bài thành công')
      router.push(`/placement/result/${attemptId}`)
    } catch (err: any) {
      toast.error(err?.message || 'Không thể nộp bài')
    } finally {
      setIsSaving(false)
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
    <div className="flex h-screen overflow-hidden bg-white dark:bg-zinc-950">
      <div className={`shrink-0 overflow-hidden border-r border-zinc-200 transition-all dark:border-zinc-800 ${sidebarOpen ? 'w-64' : 'w-0'}`}>
        {sidebarOpen && (
          <TestSidebar
            sections={attempt.test.sections.map(section => ({ id: section.id, title: section.title, questions: section.questions.map((q, i) => ({ id: q.id, title: `Câu ${i + 1}`, answered: hasAnswerValue(answers.get(q.id)) })) }))}
            currentSectionId={currentSectionId}
            currentQuestionId={currentQuestionId}
            onSectionSelect={sectionId => { setCurrentSectionId(sectionId); const first = attempt.test.sections.find(s => s.id === sectionId)?.questions[0]; if (first) setCurrentQuestionId(first.id) }}
            onQuestionSelect={(questionId, sectionId) => { setCurrentSectionId(sectionId); setCurrentQuestionId(questionId) }}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(prev => !prev)} className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">{sidebarOpen ? <X size={20} /> : <Menu size={20} />}</button>
            <h1 className="truncate text-xl font-bold text-zinc-900 dark:text-white">{attempt.test.title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <TestProgressBar answered={Array.from(answers.values()).filter(hasAnswerValue).length} total={attempt.test.sections.reduce((s, sec) => s + (sec.questions?.length || 0), 0)} />
            <FullscreenButton containerRef={containerRef as React.RefObject<HTMLDivElement>} />
            <Button variant="outline" size="sm" onClick={handleSubmit} disabled={isSaving}>{isSaving ? 'Đang xử lý...' : 'Nộp bài'}</Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {currentQuestion && (
            <div className="mx-auto max-w-2xl">
              <TestQuestionDisplay question={currentQuestion as any} index={currentSection?.questions.findIndex(q => q.id === currentQuestion.id) || 0} total={currentSection?.questions.length || 0} answer={currentAnswer} onAnswerChange={handleAnswerChange} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Button variant="outline" onClick={() => { /* previous logic */ }}>
            ← Câu trước
          </Button>

          <div className="text-sm text-zinc-600 dark:text-zinc-400">{isSaving && <span className="font-semibold text-blue-500">Đang lưu...</span>}</div>

          <Button onClick={() => { /* next logic */ }}>
            Câu sau →
          </Button>
        </div>
      </div>
    </div>
  )
}
