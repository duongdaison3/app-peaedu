'use client'

interface TestAnswerOptionProps {
  id: string
  label: string
  isSelected: boolean
  onChange: (id: string) => void
  disabled?: boolean
}

export function TestAnswerOption({
  id,
  label,
  isSelected,
  onChange,
  disabled = false
}: TestAnswerOptionProps) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-blue-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        type="radio"
        value={id}
        checked={isSelected}
        onChange={() => onChange(id)}
        disabled={disabled}
        className="mt-1 w-4 h-4 cursor-pointer"
      />
      <span className="text-sm flex-1 break-words">{label}</span>
    </label>
  )
}
