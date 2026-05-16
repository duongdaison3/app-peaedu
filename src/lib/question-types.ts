import type { QuestionType } from '@prisma/client'

export interface QuestionTypeConfig {
  label: string
  category: 'basic' | 'speaking_writing' | 'reading' | 'listening'
  description: string
  requiresOptions: boolean
  requiresMedia: boolean
  requiresAudio: boolean
  answerType: 'single_text' | 'multiple_choice' | 'multiple_select' | 'audio' | 'ordered_list'
}

export const QUESTION_TYPE_CONFIG: Record<QuestionType, QuestionTypeConfig> = {
  // Basic types
  mcq: {
    label: 'Multiple Choice',
    category: 'basic',
    description: 'Single correct answer from multiple options',
    requiresOptions: true,
    requiresMedia: false,
    requiresAudio: false,
    answerType: 'multiple_choice'
  },
  fill_in_blank: {
    label: 'Fill in the Blank',
    category: 'basic',
    description: 'User provides text to fill blank(s)',
    requiresOptions: false,
    requiresMedia: false,
    requiresAudio: false,
    answerType: 'single_text'
  },
  essay: {
    label: 'Essay',
    category: 'basic',
    description: 'User writes extended response',
    requiresOptions: false,
    requiresMedia: false,
    requiresAudio: false,
    answerType: 'single_text'
  },
  matching: {
    label: 'Matching',
    category: 'basic',
    description: 'Match items from two columns',
    requiresOptions: true,
    requiresMedia: false,
    requiresAudio: false,
    answerType: 'multiple_choice'
  },
  true_false: {
    label: 'True/False',
    category: 'basic',
    description: 'User selects true or false',
    requiresOptions: false,
    requiresMedia: false,
    requiresAudio: false,
    answerType: 'multiple_choice'
  },

  // Speaking & Writing (PTE-style)
  personal_introduction: {
    label: 'Personal Introduction',
    category: 'speaking_writing',
    description: 'Candidate introduces themselves in 30-60 seconds',
    requiresOptions: false,
    requiresMedia: false,
    requiresAudio: true,
    answerType: 'audio'
  },
  read_aloud: {
    label: 'Read Aloud',
    category: 'speaking_writing',
    description: 'Candidate reads text aloud (30-40 seconds)',
    requiresOptions: false,
    requiresMedia: false,
    requiresAudio: true,
    answerType: 'audio'
  },
  repeat_sentence: {
    label: 'Repeat Sentence',
    category: 'speaking_writing',
    description: 'Candidate listens and repeats sentence',
    requiresOptions: false,
    requiresMedia: true,
    requiresAudio: true,
    answerType: 'audio'
  },
  describe_image: {
    label: 'Describe Image',
    category: 'speaking_writing',
    description: 'Candidate describes image in 25-40 seconds',
    requiresOptions: false,
    requiresMedia: true,
    requiresAudio: true,
    answerType: 'audio'
  },
  re_tell_lecture: {
    label: 'Re-tell Lecture',
    category: 'speaking_writing',
    description: 'Candidate retells lecture (30-40 seconds)',
    requiresOptions: false,
    requiresMedia: true,
    requiresAudio: true,
    answerType: 'audio'
  },
  answer_short_question: {
    label: 'Answer Short Question',
    category: 'speaking_writing',
    description: 'Candidate answers question in 10 seconds',
    requiresOptions: false,
    requiresMedia: true,
    requiresAudio: true,
    answerType: 'audio'
  },
  summarize_group_discussion: {
    label: 'Summarize Group Discussion',
    category: 'speaking_writing',
    description: 'Candidate summarizes discussion (30-40 seconds)',
    requiresOptions: false,
    requiresMedia: true,
    requiresAudio: true,
    answerType: 'audio'
  },
  respond_to_situation: {
    label: 'Respond to a Situation',
    category: 'speaking_writing',
    description: 'Candidate responds to scenario (25-35 seconds)',
    requiresOptions: false,
    requiresMedia: false,
    requiresAudio: true,
    answerType: 'audio'
  },

  // Reading (PTE-style)
  multiple_choice_single: {
    label: 'Multiple Choice (Reading)',
    category: 'reading',
    description: 'Select one correct answer from multiple options',
    requiresOptions: true,
    requiresMedia: false,
    requiresAudio: false,
    answerType: 'multiple_choice'
  },
  re_order_paragraphs: {
    label: 'Re-order Paragraphs',
    category: 'reading',
    description: 'Arrange paragraphs in correct order',
    requiresOptions: true,
    requiresMedia: false,
    requiresAudio: false,
    answerType: 'ordered_list'
  },

  // Listening (PTE-style)
  summarize_spoken_text: {
    label: 'Summarize Spoken Text',
    category: 'listening',
    description: 'Listen and summarize in 50-70 words',
    requiresOptions: false,
    requiresMedia: true,
    requiresAudio: true,
    answerType: 'single_text'
  },
  highlight_correct_summary: {
    label: 'Highlight Correct Summary',
    category: 'listening',
    description: 'Select correct summary after listening',
    requiresOptions: true,
    requiresMedia: true,
    requiresAudio: true,
    answerType: 'multiple_select'
  },
  select_missing_word: {
    label: 'Select Missing Word',
    category: 'listening',
    description: 'Select missing word from dropdown',
    requiresOptions: true,
    requiresMedia: true,
    requiresAudio: true,
    answerType: 'multiple_choice'
  },
  write_from_dictation: {
    label: 'Write from Dictation',
    category: 'listening',
    description: 'Listen and write exactly what you hear',
    requiresOptions: false,
    requiresMedia: true,
    requiresAudio: true,
    answerType: 'single_text'
  }
}

export function getQuestionTypesByCategory(category: QuestionTypeConfig['category']): QuestionType[] {
  return Object.entries(QUESTION_TYPE_CONFIG)
    .filter(([_, config]) => config.category === category)
    .map(([type]) => type as QuestionType)
}

export function getQuestionTypeLabel(type: QuestionType): string {
  return QUESTION_TYPE_CONFIG[type]?.label || type
}

export function getQuestionTypeDescription(type: QuestionType): string {
  return QUESTION_TYPE_CONFIG[type]?.description || ''
}
