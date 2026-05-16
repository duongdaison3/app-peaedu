'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getAttemptResults, calculateSkillScores } from '@/modules/test/actions'
import { CheckCircle2, XCircle, BarChart3, Award } from 'lucide-react'
import { toast } from 'sonner'

interface AttemptResult {
  id: string
  totalScore?: number
  test: {
    title: string
    sections: Array<{
      title: string
      skill?: string
    }>
  }
  answers: Array<{
    id: string
    question: {
      id: string
      title: string
      score: number
      type: string
    }
    score?: number
    feedback?: string
  }>
}

interface SkillScore {
  skill: string
  percentage: number
  correct: number
  total: number
}

export default function TestResultsPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.attemptId as string

  const [result, setResult] = useState<AttemptResult | null>(null)
  const [skillScores, setSkillScores] = useState<SkillScore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadResults = async () => {
      try {
        const data = await getAttemptResults(attemptId)
        setResult(data as any)

        const scores = await calculateSkillScores(attemptId)
        setSkillScores(scores)
      } catch (error: any) {
        toast.error(error?.message || 'Lỗi tải kết quả')
        router.push('/dashboard/tests')
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [attemptId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">Đang tính toán kết quả...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return <div>Không tìm thấy kết quả</div>
  }

  const totalScore = result.totalScore || 0
  const totalQuestions = result.answers.length
  const answeredQuestions = result.answers.filter(a => a.score !== null).length

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
            {result.test.title}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">Kết quả bài thi</p>
        </div>

        {/* Score Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {/* Total Score */}
            <div>
              <div className="text-5xl font-bold bg-linear-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                {totalScore.toFixed(1)}
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">Điểm tổng</p>
            </div>

            {/* Correct Answers */}
            <div>
              <div className="text-5xl font-bold text-green-500 mb-2">{answeredQuestions}</div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Câu trả lời ({totalQuestions} câu)
              </p>
            </div>

            {/* Accuracy */}
            <div>
              <div className="text-5xl font-bold text-amber-500 mb-2">
                {totalQuestions > 0 ? ((answeredQuestions / totalQuestions) * 100).toFixed(0) : 0}%
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">Độ chính xác</p>
            </div>
          </div>
        </div>

        {/* Skill Breakdown */}
        {skillScores.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <BarChart3 size={24} />
              Phân tích theo kỹ năng
            </h2>

            <div className="space-y-4">
              {skillScores.map(skill => (
                <div key={skill.skill} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-zinc-900 dark:text-white capitalize">
                      {skill.skill}
                    </span>
                    <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                      {skill.correct}/{skill.total} ({skill.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-linear-to-r from-green-500 to-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${skill.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Answers */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
            <Award size={24} />
            Chi tiết từng câu
          </h2>

          <div className="space-y-3">
            {result.answers.map((answer, idx) => (
              <div
                key={answer.id}
                className={`p-4 rounded-lg border-2 ${
                  answer.score && answer.score > 0
                    ? 'border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10'
                    : 'border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  {answer.score && answer.score > 0 ? (
                    <CheckCircle2 className="text-green-500 shrink-0 mt-1" size={20} />
                  ) : (
                    <XCircle className="text-red-500 shrink-0 mt-1" size={20} />
                  )}

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-white">
                          Câu {idx + 1}: {answer.question.title}
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                          Loại: <span className="font-medium">{answer.question.type}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-zinc-900 dark:text-white">
                          {answer.score || 0}/{answer.question.score}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">điểm</p>
                      </div>
                    </div>

                    {answer.feedback && (
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2 p-2 bg-white dark:bg-zinc-800 rounded">
                        Nhận xét: {answer.feedback}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/tests')}
          >
            Quay lại danh sách bài thi
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  )
}
