"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function PlacementResultPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.attemptId as string

  const [attempt, setAttempt] = useState<any | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/placement/result/${attemptId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Cannot load result')
        setAttempt(data)
      } catch (err: any) {
        toast.error(err?.message || 'Không thể tải kết quả')
        router.push('/placement')
      }
    })()
  }, [attemptId, router])

  const totalScore = attempt?.totalScore ?? 0
  const percentage = attempt?.percentage ?? 0

  const recommendLevel = (p: number) => {
    if (p >= 85) return 'C1 - Advanced'
    if (p >= 70) return 'B2 - Upper Intermediate'
    if (p >= 55) return 'B1 - Intermediate'
    if (p >= 40) return 'A2 - Elementary'
    return 'A1 - Beginner'
  }

  if (!attempt) return <div className="flex h-64 items-center justify-center">Đang tải...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-12">
      <h1 className="text-2xl font-bold">Kết quả Placement</h1>
      <div className="rounded-lg border p-6">
        <div className="text-sm text-zinc-600">Tổng điểm</div>
        <div className="mt-2 text-4xl font-semibold text-sky-600">{totalScore}</div>
        <div className="mt-1 text-sm text-zinc-500">{percentage}%</div>
        <div className="mt-4">Recommended level: <strong>{recommendLevel(percentage)}</strong></div>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="font-semibold">Skill breakdown</h2>
        <div className="mt-3 space-y-3">
          {(attempt?.skillScores || []).map((s: any) => (
            <div key={s.skill} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="capitalize">{s.skill}</div>
                <div className="text-zinc-600">{Math.round(s.percentage)}%</div>
              </div>
              <div className="h-2 rounded-full bg-zinc-100">
                <div className="h-2 rounded-full bg-sky-500" style={{ width: `${Math.min(100, Math.max(0, s.percentage))}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => router.push('/placement')}>Back</Button>
        <Button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success('Link copied') }}>Copy Link</Button>
        <Button onClick={async () => {
          try {
            const res = await fetch(`/api/placement/result/${attemptId}/export`)
            if (!res.ok) throw new Error('Export failed')
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `placement-${attemptId}.csv`
            a.click()
            URL.revokeObjectURL(url)
          } catch (e: any) {
            toast.error(e?.message || 'Không thể export CSV')
          }
        }}>Export CSV</Button>
      </div>
    </div>
  )
}
