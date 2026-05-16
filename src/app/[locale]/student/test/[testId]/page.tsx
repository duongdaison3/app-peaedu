'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getTest, startTestAttempt, submitTestAttempt } from '@/modules'

export default function TestTakerPage() {
  const params = useParams()
  const testId = params.testId as string

  const [test, setTest] = useState<any>(null)
  const [attempt, setAttempt] = useState<any>(null)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    const loadTest = async () => {
      try {
        const testData = await getTest(testId)
        setTest(testData)

        // Start attempt
        const newAttempt = await startTestAttempt(testId)
        setAttempt(newAttempt)

        // Set timer
        if (testData.sections[0]?.durationMinutes) {
          setTimeLeft(testData.sections[0].durationMinutes * 60)
        }
      } catch (error) {
        console.error('Error loading test:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTest()
  }, [testId])

  // Timer effect
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev > 0) return prev - 1
        return 0
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleSubmit = async () => {
    if (!attempt) return

    setSubmitting(true)
    try {
      const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answerJson: answer
      }))

      await submitTestAttempt(attempt.id, answerArray)
      // Redirect to results
      window.location.href = `/results/${attempt.id}`
    } catch (error) {
      console.error('Error submitting test:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading test...</div>
  if (!test) return <div className="p-8 text-center">Test not found</div>

  const currentSection = test.sections[currentSectionIndex]
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with timer */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">{test.title}</h1>
          <div className="text-lg font-bold text-red-600">
            {timeLeft !== null && formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Section Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-20">
              <h3 className="font-bold text-gray-900 mb-4">Sections</h3>
              <div className="space-y-2">
                {test.sections.map((section: any, idx: number) => (
                  <button
                    key={section.id}
                    onClick={() => setCurrentSectionIndex(idx)}
                    className={`block w-full text-left px-4 py-2 rounded font-semibold transition ${
                      currentSectionIndex === idx
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main - Questions */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {currentSection?.title}
              </h2>

              <div className="space-y-8">
                {currentSection?.questions.map((tq: any) => (
                  <div key={tq.id} className="pb-6 border-b last:border-b-0">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {tq.question.title || tq.question.content}
                    </h3>

                    {tq.question.type === 'mcq' && (
                      <div className="space-y-3">
                        {tq.question.options.map((option: any) => (
                          <label key={option.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name={`question-${tq.id}`}
                              value={option.id}
                              checked={answers[tq.questionId]?.selectedId === option.id}
                              onChange={() =>
                                handleAnswer(tq.questionId, { selectedId: option.id })
                              }
                              className="mr-3"
                            />
                            <span>{option.content}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {tq.question.type === 'fill_in_blank' && (
                      <input
                        type="text"
                        value={answers[tq.questionId]?.text || ''}
                        onChange={(e) =>
                          handleAnswer(tq.questionId, { text: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your answer"
                      />
                    )}

                    {tq.question.type === 'essay' && (
                      <textarea
                        value={answers[tq.questionId]?.text || ''}
                        onChange={(e) =>
                          handleAnswer(tq.questionId, { text: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-32"
                        placeholder="Write your answer here"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between">
                <Button
                  onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
                  disabled={currentSectionIndex === 0}
                  variant="outline"
                >
                  Previous Section
                </Button>

                {currentSectionIndex === test.sections.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? 'Submitting...' : 'Submit Test'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentSectionIndex(currentSectionIndex + 1)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next Section
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
