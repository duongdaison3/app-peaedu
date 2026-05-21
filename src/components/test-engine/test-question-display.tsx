'use client'

import type { ReactNode } from 'react'
import { SpeakingRecorder } from './speaking-recorder'
import { TestAnswerOption } from './test-answer-option'

interface Question {
  id: string
  title: string
  content: string
  type: string
  options?: Array<{ id: string; text?: string; content?: string }>
  media?: Array<{ type: string; url: string }>
  skill?: string
  configJson?: Record<string, any>
}

type Choice = {
  id: string
  text: string
}

function normalizeChoices(source: any): Choice[] {
  if (!Array.isArray(source)) return []

  return source
    .map((item, index) => {
      if (typeof item === 'string') {
        return { id: String(index), text: item.trim() }
      }

      if (item && typeof item === 'object') {
        const text = item.text ?? item.content ?? item.label ?? item.value ?? item.name
        return {
          id: String(item.id ?? item.value ?? index),
          text: String(text ?? '').trim()
        }
      }

      return { id: String(index), text: String(item ?? '').trim() }
    })
    .filter((item) => item.text)
}

function normalizePairs(source: any): Array<{ left: string; right: string }> {
  if (!Array.isArray(source)) return []

  return source
    .map((item) => {
      if (typeof item === 'string') {
        const [left = '', right = ''] = item.split('|')
        return { left: left.trim(), right: right.trim() }
      }

      if (item && typeof item === 'object') {
        return {
          left: String(item.left ?? item.content ?? item.question ?? '').trim(),
          right: String(item.right ?? item.meaning ?? item.answer ?? '').trim()
        }
      }

      return { left: '', right: '' }
    })
    .filter((pair) => pair.left || pair.right)
}

function normalizeOptionGroups(source: any): string[][] {
  if (!Array.isArray(source)) return []

  return source
    .map((item) => {
      if (Array.isArray(item)) {
        return item.map((entry) => String(entry).trim()).filter(Boolean)
      }

      if (typeof item === 'string') {
        return item.split('|').map((entry) => entry.trim()).filter(Boolean)
      }

      if (item && typeof item === 'object') {
        const rawOptions = item.options ?? item.values ?? item.choices
        if (Array.isArray(rawOptions)) {
          return rawOptions.map((entry: any) => String(entry).trim()).filter(Boolean)
        }

        if (typeof item.text === 'string') {
          return item.text.split('|').map((entry: string) => entry.trim()).filter(Boolean)
        }
      }

      return []
    })
    .filter((group) => group.length > 0)
}

function getPrompt(question: Question) {
  return question.configJson?.instruction || question.configJson?.prompt || question.configJson?.passage || question.content
}

function renderInlineBlankPrompt(
  prompt: string,
  answer: any,
  onAnswerChange: (nextAnswer: any) => void,
  readOnly: boolean
): ReactNode | null {
  const blankValues = Array.isArray(answer?.blankValues) ? answer.blankValues : []
  const pattern = /\[\[?blank_(\d+)\]?\]/gi
  const segments: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null = null

  while ((match = pattern.exec(prompt)) !== null) {
    const [token, blankNumber] = match
    const blankIndex = Math.max(0, Number.parseInt(blankNumber, 10) - 1)

    if (match.index > lastIndex) {
      segments.push(<span key={`text-${lastIndex}`}>{prompt.slice(lastIndex, match.index)}</span>)
    }

    segments.push(
      <input
        key={`${token}-${match.index}`}
        type="text"
        value={blankValues[blankIndex] || ''}
        onChange={(event) => {
          if (readOnly) return

          const nextValues = [...blankValues]
          nextValues[blankIndex] = event.target.value
          onAnswerChange({ blankValues: nextValues })
        }}
        disabled={readOnly}
        className="mx-1 inline-block w-32 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        aria-label={`Blank ${blankIndex + 1}`}
      />
    )

    lastIndex = match.index + token.length
  }

  if (segments.length === 0) return null

  if (lastIndex < prompt.length) {
    segments.push(<span key={`tail-${lastIndex}`}>{prompt.slice(lastIndex)}</span>)
  }

  return <div className="prose dark:prose-invert max-w-none text-sm leading-7">{segments}</div>
}

function renderMedia(media?: Array<{ type: string; url: string }>) {
  if (!media || media.length === 0) return null

  return (
    <div className="space-y-2">
      {media.map((item, index) => (
        <div key={`${item.url}-${index}`} className="rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {item.type.startsWith('audio') ? (
            <audio src={item.url} controls className="w-full" />
          ) : (
            <img src={item.url} alt="Question media" className="w-full max-h-64 object-cover" />
          )}
        </div>
      ))}
    </div>
  )
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
  const prompt = getPrompt(question)
  const choiceOptions = normalizeChoices(question.options?.length ? question.options : question.configJson?.optionsList || question.configJson?.options)
  const matchingPairs = normalizePairs(question.configJson?.pairs || question.configJson?.pairsList)
  const paragraphBlocks = normalizeChoices(question.configJson?.paragraphs || question.configJson?.blocks || question.configJson?.optionsList).map((choice) => choice.text)
  const optionGroups = normalizeOptionGroups(question.configJson?.blanks)
  const speakingTypes = [
    'speaking',
    'personal_introduction',
    'read_aloud',
    'repeat_sentence',
    'describe_image',
    're_tell_lecture',
    'answer_short_question',
    'summarize_group_discussion',
    'respond_to_situation'
  ]

  const renderBody = () => {
    const isSpeakingQuestion = question.skill === 'speaking' || speakingTypes.includes(question.type)

    if (isSpeakingQuestion) {
      return (
        <div className="space-y-4">
          <div className="prose dark:prose-invert max-w-none text-sm">{prompt}</div>
          <SpeakingRecorder value={answer} onChange={(value) => onAnswerChange(value)} readOnly={readOnly} />
        </div>
      )
    }

    switch (question.type) {
      case 'mcq':
      case 'multiple_choice_single':
        return (
          <div className="space-y-3">
            <div className="prose dark:prose-invert max-w-none text-sm">{prompt}</div>
            <div className="space-y-2">
              {choiceOptions.map((option) => (
                <TestAnswerOption
                  key={option.id}
                  id={option.id}
                  label={option.text}
                  isSelected={answer?.selectedId === option.id}
                  onChange={(id) => onAnswerChange({ selectedId: id })}
                  disabled={readOnly}
                />
              ))}
            </div>
          </div>
        )

      case 'highlight_correct_summary':
        return (
          <div className="space-y-3">
            <div className="prose dark:prose-invert max-w-none text-sm">{prompt}</div>
            <div className="space-y-2">
              {choiceOptions.map((option) => {
                const selectedIds = Array.isArray(answer?.selectedIds) ? answer.selectedIds : []
                const isSelected = selectedIds.includes(option.id)

                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (readOnly) return

                      const nextSelected = isSelected
                        ? selectedIds.filter((id: string) => id !== option.id)
                        : [...selectedIds, option.id]

                      onAnswerChange({ selectedIds: nextSelected })
                    }}
                    disabled={readOnly}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-200'
                        : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600'
                    } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm">{option.text}</span>
                      <span className="text-xs font-medium">{isSelected ? 'Đã chọn' : 'Chọn'}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 'true_false':
        return (
          <div className="space-y-3">
            <div className="prose dark:prose-invert max-w-none text-sm">{prompt}</div>
            <div className="flex gap-3">
              {['true', 'false'].map((value) => (
                <button
                  key={value}
                  onClick={() => !readOnly && onAnswerChange({ selectedValue: value })}
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
      case 'summarize_spoken_text':
      case 'write_from_dictation': {
        const inlinePrompt = renderInlineBlankPrompt(prompt, answer, onAnswerChange, readOnly)

        return (
          <div className="space-y-3">
            {inlinePrompt || <div className="prose dark:prose-invert max-w-none text-sm">{prompt}</div>}
            {inlinePrompt || optionGroups.length > 0 ? null : (
              <input
                type="text"
                value={answer?.text || ''}
                onChange={(event) => !readOnly && onAnswerChange({ text: event.target.value })}
                disabled={readOnly}
                placeholder="Nhập câu trả lời của bạn..."
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
              />
            )}
          </div>
        )
      }

      case 'matching':
        return (
          <div className="space-y-3">
            <div className="prose dark:prose-invert max-w-none text-sm">{prompt}</div>
            {matchingPairs.length > 0 ? (
              <div className="space-y-2">
                {matchingPairs.map((pair, pairIndex) => {
                  const rightOptions = Array.from(new Set(matchingPairs.map((item) => item.right).filter(Boolean)))
                  const selectedMatches = Array.isArray(answer?.matches) ? answer.matches : []

                  return (
                    <div
                      key={`${pair.left}-${pairIndex}`}
                      className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-[minmax(0,1fr),220px]"
                    >
                      <div className="text-sm text-zinc-900 dark:text-zinc-100">{pair.left}</div>
                      <select
                        value={selectedMatches[pairIndex] || ''}
                        onChange={(event) => {
                          if (readOnly) return

                          const nextMatches = [...selectedMatches]
                          nextMatches[pairIndex] = event.target.value
                          onAnswerChange({ matches: nextMatches })
                        }}
                        disabled={readOnly}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      >
                        <option value="">Chọn đáp án</option>
                        {rightOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                Chưa có dữ liệu ghép cặp cho câu hỏi này.
              </div>
            )}
          </div>
        )

      case 're_order_paragraphs':
        return (
          <div className="space-y-3">
            <div className="prose dark:prose-invert max-w-none text-sm">{prompt}</div>
            {paragraphBlocks.length > 0 ? (
              <div className="space-y-2">
                {paragraphBlocks.map((paragraph, paragraphIndex) => {
                  const currentOrder = Array.isArray(answer?.order) ? answer.order : paragraphBlocks
                  const moveParagraph = (direction: -1 | 1) => {
                    if (readOnly) return

                    const targetIndex = paragraphIndex + direction
                    if (targetIndex < 0 || targetIndex >= currentOrder.length) return

                    const nextOrder = [...currentOrder]
                    ;[nextOrder[paragraphIndex], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[paragraphIndex]]
                    onAnswerChange({ order: nextOrder })
                  }

                  return (
                    <div
                      key={`${paragraph}-${paragraphIndex}`}
                      className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 text-sm text-zinc-900 dark:text-zinc-100">
                          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            {paragraphIndex + 1}
                          </span>
                          {paragraph}
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => moveParagraph(-1)}
                            disabled={readOnly || paragraphIndex === 0}
                            className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            Lên
                          </button>
                          <button
                            type="button"
                            onClick={() => moveParagraph(1)}
                            disabled={readOnly || paragraphIndex === currentOrder.length - 1}
                            className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            Xuống
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                Chưa có đoạn văn để sắp xếp.
              </div>
            )}
          </div>
        )

      default:
        return (
          <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            Loại câu hỏi này chưa có giao diện chuyên biệt trên frontend. Type: {question.type}
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-700">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Câu {index + 1} / {total}
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
          {question.skill === 'speaking' || speakingTypes.includes(question.type)
            ? 'Nói'
            : question.type === 'mcq' || question.type === 'multiple_choice_single'
              ? 'Trắc nghiệm'
              : question.type === 'matching'
                ? 'Ghép đôi'
                : question.type === 're_order_paragraphs'
                  ? 'Sắp xếp'
                  : question.type === 'select_missing_word'
                    ? 'Chọn từ'
                    : question.type === 'essay' || question.type === 'summarize_spoken_text' || question.type === 'write_from_dictation'
                      ? 'Tự luận'
                      : 'Điền vào chỗ trống'}
        </span>
      </div>

      {renderMedia(question.media)}
      {renderBody()}
    </div>
  )
}
