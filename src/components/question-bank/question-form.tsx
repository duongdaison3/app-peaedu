'use client'

import { QuestionBuilder } from '../question-builder'

interface QuestionFormProps {
  folderId?: string
  question?: any
  onSuccess?: () => void
  onClose?: () => void
}

/**
 * QuestionForm - Wrapper around the modular QuestionBuilder
 * 
 * The QuestionBuilder provides a schema-driven, modular architecture with:
 * - 5 fixed sections: Question Settings, Prompt, Media, Answer Config, Scoring
 * - 3-column layout: Left (Settings) | Center (Builder) | Right (Scoring)
 * - Support for 18+ question types (Basic, Speaking, Reading, Listening)
 * - Dynamic form rendering based on question type schema
 * 
 * @see QuestionBuilder for implementation
 */
export function QuestionForm({
  folderId,
  question,
  onSuccess,
  onClose
}: QuestionFormProps) {
  return (
    <QuestionBuilder
      folderId={folderId}
      question={question}
      onSuccess={onSuccess}
      onClose={onClose}
    />
  )
}
