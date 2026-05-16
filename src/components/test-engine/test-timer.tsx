'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Clock } from 'lucide-react'

interface TestTimerProps {
  durationMinutes: number
  onTimeUp: () => void
  isWarning?: boolean
}

export function TestTimer({
  durationMinutes,
  onTimeUp,
  isWarning = false
}: TestTimerProps) {
  // Support debug mode where durationMinutes is treated as seconds (fast testing)
  const [timeLeft, setTimeLeft] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('debugFastTimers') === '1') {
          return durationMinutes // treat as seconds
        }
      }
    } catch (e) {}
    return durationMinutes * 60
  }) // in seconds
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false)
            onTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isActive, timeLeft, onTimeUp])

  // Reset timer when duration changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('debugFastTimers') === '1') {
          setTimeLeft(durationMinutes)
        } else {
          setTimeLeft(durationMinutes * 60)
        }
      }
    } catch (e) {
      setTimeLeft(durationMinutes * 60)
    }
    setIsActive(true)
  }, [durationMinutes])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const isLowTime = timeLeft <= 300 // 5 minutes

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0'
  )}`

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
        isLowTime
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      }`}
    >
      {isLowTime ? (
        <AlertCircle size={20} className="animate-pulse" />
      ) : (
        <Clock size={20} />
      )}
      <span>{formattedTime}</span>
      {isLowTime && <span className="text-xs ml-1">(Hết giờ sắp)</span>}
    </div>
  )
}
