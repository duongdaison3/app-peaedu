'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getAttemptResults, calculateSkillScores } from '@/modules'

export default function ResultsPage() {
  const params = useParams()
  const attemptId = params.attemptId as string

  const [attempt, setAttempt] = useState<any>(null)
  const [skillScores, setSkillScores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadResults = async () => {
      try {
        const results = await getAttemptResults(attemptId)
        setAttempt(results)

        const scores = await calculateSkillScores(attemptId)
        setSkillScores(scores)
      } catch (error) {
        console.error('Error loading results:', error)
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [attemptId])

  if (loading) return <div className="p-8 text-center">Loading results...</div>
  if (!attempt) return <div className="p-8 text-center">Results not found</div>

  const totalScore = attempt.totalScore || 0
  const maxScore = attempt.answers.reduce((sum: number, a: any) => sum + (a.question.score || 0), 0)
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Score Summary */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 text-white mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Score</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-5xl font-bold">{Math.round(totalScore)}</p>
              <p className="text-blue-100 mt-2">Total Points</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold">{Math.round(percentage)}%</p>
              <p className="text-blue-100 mt-2">Correct Answers</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold">{attempt.answers.length}</p>
              <p className="text-blue-100 mt-2">Total Questions</p>
            </div>
          </div>
        </div>

        {/* Skill Breakdown */}
        {skillScores.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Performance by Skill</h3>
            <div className="space-y-6">
              {skillScores.map(skill => (
                <div key={skill.skill}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900 capitalize">
                      {skill.skill}
                    </span>
                    <span className="text-gray-600">
                      {skill.correct}/{skill.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${skill.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{Math.round(skill.percentage)}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Answers */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-xl font-bold text-gray-900">Answer Review</h3>
          </div>
          <div className="divide-y">
            {attempt.answers.map((answer: any, idx: number) => (
              <div key={answer.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Question {idx + 1}: {answer.question.title || 'Untitled'}
                    </p>
                    <p className="text-gray-600 text-sm mt-2">{answer.question.content}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    answer.score && answer.score > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {answer.score ? '✓ Correct' : '✗ Incorrect'}
                  </div>
                </div>

                {answer.question.type === 'mcq' && (
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600 mb-2">Your answer:</p>
                    <p className="font-semibold text-gray-900">
                      {answer.question.options.find((o: any) => o.id === answer.answerJson?.selectedId)?.content}
                    </p>
                  </div>
                )}

                {answer.feedback && (
                  <div className="mt-4 p-4 bg-blue-50 rounded border-l-4 border-blue-500">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Teacher Feedback:</p>
                    <p className="text-gray-700">{answer.feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline">Download Results</Button>
          <Button className="bg-blue-600 hover:bg-blue-700">Back to Dashboard</Button>
        </div>
      </main>
    </div>
  )
}
