'use client'

import { SpeakingRecorder } from './speaking-recorder'
import { TestAnswerOption } from './test-answer-option'

interface Question {
  id: string
  title: string
  content: string
  type: 'mcq' | 'fill_in_blank' | 'essay' | 'matching' | 'true_false' | 'speaking'
  options?: Array<{ id: string; text: string }>
  media?: Array<{ type: string; url: string }>
  skill?: string
}

interface TestQuestionDisplayProps {
  question: Question
  index: number
  total: number
  answer?: any
  onAnswerChange: (answer: any) => void
  readOnly?: boolean
}

export function TestQuestionDisplay({
  question,
  index,
  total,
  answer,
  onAnswerChange,
  readOnly = false
}: TestQuestionDisplayProps) {
  const renderQuestion = () => {
    const isSpeakingQuestion = question.skill === 'speaking' || question.type === 'speaking'

    if (isSpeakingQuestion) {
      return (
        <div className="space-y-4">
          <div className="prose dark:prose-invert max-w-none text-sm">{question.content}</div>
          <SpeakingRecorder value={answer} onChange={value => onAnswerChange(value)} readOnly={readOnly} />
        </div>
      )
    }

    switch (question.type) {
      case 'mcq':
        return (
          <div className="space-y-3">
            <div className="prose dark:prose-invert max-w-none text-sm">{question.content}</div>
            <div className="space-y-2">
              {question.options?.map(option => (
                <TestAnswerOption
                  key={option.id}
                  id={option.id}
                  label={option.text}
                  isSelected={answer?.selectedId === option.id}
                  onChange={id => onAnswerChange({ selectedId: id })}
                  disabled={readOnly}
                />
              ))}
            </div>
          </div>
        )

      case 'true_false':
        return (
          <div className="space-y-3">
            <div className="prose dark:prose-invert max-w-none text-sm">{question.content}</div>
            <div className="flex gap-3">
              {['true', 'false'].map(value => (
                <button
                  key={value}
                  onClick={() =>
                    !readOnly && onAnswerChange({ selectedValue: value })
                  }
                  disabled={readOnly}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                    answer?.selectedValue === value
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {value === 'true' ? 'Đúng' : 'Sai'}
                </button>
              ))}
            </div>
          </div>
        )

      case 'fill_in_blank':
        return (
          <div className="space-y-3">
            <div className="prose dark:prose-invert max-w-none text-sm">{question.content}</div>
            <input
              type="text"
              value={answer?.text || ''}
              onChange={e => !readOnly && onAnswerChange({ text: e.target.value })}
              disabled={readOnly}
              placeholder="Nhập câu trả lời của bạn..."
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
            />
          </div>
        )

      case 'essay':
        return (
          <div className="space-y-3">
            <div className="prose dark:prose-invert max-w-none text-sm">{question.content}</div>
            <textarea
              value={answer?.text || ''}
              onChange={e => !readOnly && onAnswerChange({ text: e.target.value })}
              disabled={readOnly}
              placeholder="Nhập câu trả lời của bạn..."
              rows={6}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 resize-none"
            />
          </div>
        )

      default:
        return <div className="text-zinc-500">Loại câu hỏi không được hỗ trợ</div>
    }
  }

  return (
    <div className="space-y-4">
      {/* Question Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-700">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Câu {index + 1} / {total}
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
          {question.skill === 'speaking' || question.type === 'speaking'
            ? 'Nói'
            : question.type === 'mcq'
            ? 'Trắc nghiệm'
            : question.type === 'essay'
              ? 'Tự luận'
              : 'Điền vào chỗ trống'}
        </span>
      </div>

      {/* Media */}
      {question.media && question.media.length > 0 && (
        <div className="space-y-2">
          {question.media.map((media, idx) => (
            <div key={idx} className="rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              {media.type.startsWith('audio') ? (
                <audio
                  src={media.url}
                  controls
                  className="w-full"
                />
              ) : (
                <img
                  src={media.url}
                  alt="Question media"
                  className="w-full max-h-64 object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Question Content */}
      {renderQuestion()}
    </div>
  )
}
