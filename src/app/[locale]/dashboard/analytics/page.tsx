'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { Download, Target, TrendingUp, Trophy, Users } from 'lucide-react'
import { toast } from 'sonner'
import {
  getAnalyticsDashboardData,
  getAnalyticsReportCsv,
  upsertMyStudyGoal
} from '@/modules/analytics/actions'

type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsDashboardData>>

function formatMonth(period: string) {
  const [year, month] = period.split('-')
  return `${month}/${year.slice(2)}`
}

function Sparkline({ points }: { points: Array<{ period: string; averageScore: number }> }) {
  if (points.length === 0) return <div className="h-24 rounded-lg bg-zinc-100 dark:bg-zinc-900" />

  const width = 360
  const height = 120
  const max = Math.max(...points.map(point => point.averageScore), 1)
  const step = points.length > 1 ? width / (points.length - 1) : width

  const line = points
    .map((point, index) => {
      const x = index * step
      const y = height - (point.averageScore / max) * (height - 20) - 10
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full">
      <polyline points={line} fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" />
      {points.map((point, index) => {
        const x = index * step
        const y = height - (point.averageScore / max) * (height - 20) - 10
        return <circle key={point.period} cx={x} cy={y} r={3} fill="#0284c7" />
      })}
    </svg>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isPending, startTransition] = useTransition()
  const [goalForm, setGoalForm] = useState({ targetTests: '8', targetScore: '75', deadline: '' })

  const loadData = () => {
    startTransition(async () => {
      try {
        const result = await getAnalyticsDashboardData()
        setData(result)
      } catch (error: any) {
        toast.error(error?.message || 'Không thể tải dữ liệu analytics')
      }
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  const summaryCards = useMemo(() => {
    if (!data) return []
    return [
      { label: 'Total attempts', value: data.summary.totalAttempts, icon: Users },
      { label: 'Completed attempts', value: data.summary.completedAttempts, icon: Trophy },
      {
        label: 'Class average',
        value: `${Math.round(data.summary.classAverage)}%`,
        icon: TrendingUp
      },
      { label: 'Recommended level', value: data.summary.recommendedLevel, icon: Target }
    ]
  }, [data])

  const handleGoalSave = () => {
    startTransition(async () => {
      try {
        await upsertMyStudyGoal({
          targetTests: Number(goalForm.targetTests),
          targetScore: Number(goalForm.targetScore),
          deadline: goalForm.deadline
        })
        toast.success('Đã cập nhật mục tiêu học tập')
        loadData()
      } catch (error: any) {
        toast.error(error?.message || 'Không thể lưu mục tiêu')
      }
    })
  }

  const handleExport = () => {
    startTransition(async () => {
      try {
        const csv = await getAnalyticsReportCsv()
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'analytics-report.csv'
        anchor.click()
        URL.revokeObjectURL(url)
      } catch (error: any) {
        toast.error(error?.message || 'Không thể export báo cáo')
      }
    })
  }

  if (!data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-sm text-zinc-500">{isPending ? 'Đang tải analytics...' : 'Không có dữ liệu'}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Student scores, skill breakdown, class average, progress and leaderboard.
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          <Download size={16} /> Export report
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-zinc-500">{card.label}</p>
                <Icon size={16} className="text-zinc-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{card.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Progress Over Time</h2>
          <Sparkline points={data.progressOverTime} />
          <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-zinc-500">
            {data.progressOverTime.slice(-4).map(item => (
              <div key={item.period} className="rounded bg-zinc-100 px-2 py-1 text-center dark:bg-zinc-900">
                {formatMonth(item.period)}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Skill Breakdown</h2>
          <div className="mt-4 space-y-3">
            {data.skillBreakdown.slice(0, 6).map(item => (
              <div key={item.skill}>
                <div className="mb-1 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
                  <span className="capitalize">{item.skill}</span>
                  <span>{Math.round(item.percentage)}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-900">
                  <div
                    className="h-2 rounded-full bg-sky-500"
                    style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 xl:col-span-2 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Leaderboard</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-2">#</th>
                  <th className="py-2">Student</th>
                  <th className="py-2">Attempts</th>
                  <th className="py-2">Average</th>
                </tr>
              </thead>
              <tbody>
                {data.leaderboard.map(item => (
                  <tr key={item.id} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="py-2 font-semibold">{item.rank}</td>
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">{item.attempts}</td>
                    <td className="py-2 font-semibold text-sky-600 dark:text-sky-400">
                      {item.averageScore.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Study Goals</h2>
          <div className="mt-4 space-y-3">
            <input
              type="number"
              min={1}
              value={goalForm.targetTests}
              onChange={event => setGoalForm(prev => ({ ...prev, targetTests: event.target.value }))}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Target tests"
            />
            <input
              type="number"
              min={1}
              max={100}
              value={goalForm.targetScore}
              onChange={event => setGoalForm(prev => ({ ...prev, targetScore: event.target.value }))}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Target score"
            />
            <input
              type="date"
              value={goalForm.deadline}
              onChange={event => setGoalForm(prev => ({ ...prev, deadline: event.target.value }))}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              onClick={handleGoalSave}
              disabled={isPending || !goalForm.deadline}
              className="w-full rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Save Goal
            </button>
          </div>

          {data.goals.length > 0 && (
            <div className="mt-4 rounded-md bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
              Latest goal: {data.goals[0].targetTests} tests / {data.goals[0].targetScore}% by{' '}
              {new Date(data.goals[0].deadline).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
