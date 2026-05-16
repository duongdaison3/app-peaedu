'use client'

interface TestProgressBarProps {
  answered: number
  total: number
}

export function TestProgressBar({ answered, total }: TestProgressBarProps) {
  const percentage = total > 0 ? (answered / total) * 100 : 0

  return (
    <div className="space-y-2 w-full max-w-xs sm:max-w-md">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Tiến độ</span>
        <span className="font-semibold">
          {answered}/{total}
        </span>
      </div>
      <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-linear-to-r from-blue-500 to-cyan-500 h-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
