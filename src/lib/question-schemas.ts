/**
 * Question Builder Schema System
 * Defines UI structure for each question type
 */

import type { QuestionType } from '@prisma/client'

export interface FieldConfig {
  type: 'text' | 'textarea' | 'richtext' | 'number' | 'checkbox' | 'select' | 'upload' | 'options-list' | 'code-editor'
  label: string
  placeholder?: string
  required?: boolean
  description?: string
  options?: { value: string; label: string }[]
  validation?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
  }
}

export interface SectionConfig {
  id: string
  title: string
  description?: string
  fields: Record<string, FieldConfig>
  layout?: 'grid' | 'stack' | 'tabs'
  columns?: 1 | 2 | 3
}

export interface QuestionBuilderSchema {
  type: QuestionType
  label: string
  description: string
  icon?: string
  sections: SectionConfig[]
  preview?: {
    component: string
    fields: string[]
  }
}

// ============================================================
// BASIC TYPES
// ============================================================

export const MULTIPLE_CHOICE_SCHEMA: QuestionBuilderSchema = {
  type: 'mcq',
  label: 'Multiple Choice',
  description: 'Single or multiple correct answers',
  sections: [
    {
      id: 'prompt',
      title: 'Question Content',
      fields: {
        instruction: {
          type: 'textarea',
          label: 'Instruction (optional)',
          placeholder: 'Provide context or instructions'
        },
        content: {
          type: 'richtext',
          label: 'Question *',
          required: true,
          placeholder: 'Enter your question here'
        }
      }
    },
    {
      id: 'options',
      title: 'Options',
      fields: {
        optionsList: {
          type: 'options-list',
          label: 'Answer Options *',
          required: true
        },
        multipleCorrect: {
          type: 'checkbox',
          label: 'Allow multiple correct answers'
        }
      }
    },
    {
      id: 'explanation',
      title: 'Explanation',
      fields: {
        explanation: {
          type: 'richtext',
          label: 'Explanation (optional)',
          placeholder: 'Help students understand why this is correct'
        }
      }
    }
  ]
}

export const FILL_IN_BLANK_SCHEMA: QuestionBuilderSchema = {
  type: 'fill_in_blank',
  label: 'Fill in the Blank',
  description: 'Students type answer to fill blanks',
  sections: [
    {
      id: 'prompt',
      title: 'Passage',
      fields: {
        content: {
          type: 'code-editor',
          label: 'Passage with blanks *',
          required: true,
          placeholder: 'Use [[blank_1]], [[blank_2]] for blanks\nExample: The boy [[blank_1]] to school.'
        }
      }
    },
    {
      id: 'answers',
      title: 'Accepted Answers',
      fields: {
        answers: {
          type: 'options-list',
          label: 'For each blank, provide accepted answers',
          required: true
        },
        caseSensitive: {
          type: 'checkbox',
          label: 'Case sensitive'
        },
        partialMatch: {
          type: 'checkbox',
          label: 'Allow partial matching'
        }
      }
    }
  ]
}

export const ESSAY_SCHEMA: QuestionBuilderSchema = {
  type: 'essay',
  label: 'Essay',
  description: 'Students write extended response',
  sections: [
    {
      id: 'prompt',
      title: 'Essay Prompt',
      fields: {
        content: {
          type: 'richtext',
          label: 'Prompt *',
          required: true,
          placeholder: 'Enter essay prompt'
        }
      }
    },
    {
      id: 'constraints',
      title: 'Word Limits',
      layout: 'grid',
      columns: 2,
      fields: {
        minWords: {
          type: 'number',
          label: 'Minimum words',
          validation: { min: 0 }
        },
        maxWords: {
          type: 'number',
          label: 'Maximum words',
          validation: { min: 0 }
        }
      }
    },
    {
      id: 'rubric',
      title: 'Rubric (optional)',
      fields: {
        rubric: {
          type: 'textarea',
          label: 'Scoring rubric',
          placeholder: 'Define grading criteria'
        }
      }
    }
  ]
}

export const MATCHING_SCHEMA: QuestionBuilderSchema = {
  type: 'matching',
  label: 'Matching',
  description: 'Match items from two columns',
  sections: [
    {
      id: 'content',
      title: 'Matching Items',
      fields: {
        instruction: {
          type: 'textarea',
          label: 'Instruction (optional)'
        },
        items: {
          type: 'options-list',
          label: 'Left column items + Right column pairs *',
          required: true
        }
      }
    }
  ]
}

export const TRUE_FALSE_SCHEMA: QuestionBuilderSchema = {
  type: 'true_false',
  label: 'True / False',
  description: 'Students select true or false',
  sections: [
    {
      id: 'statement',
      title: 'Statement',
      fields: {
        content: {
          type: 'richtext',
          label: 'Statement *',
          required: true,
          placeholder: 'Enter a statement'
        }
      }
    },
    {
      id: 'answer',
      title: 'Correct Answer',
      fields: {
        correctAnswer: {
          type: 'select',
          label: 'Correct Answer *',
          required: true,
          options: [
            { value: 'true', label: 'True' },
            { value: 'false', label: 'False' }
          ]
        }
      }
    },
    {
      id: 'explanation',
      title: 'Explanation',
      fields: {
        explanation: {
          type: 'textarea',
          label: 'Explanation (optional)'
        }
      }
    }
  ]
}

// ============================================================
// SPEAKING & WRITING TYPES
// ============================================================

export const READ_ALOUD_SCHEMA: QuestionBuilderSchema = {
  type: 'read_aloud',
  label: 'Read Aloud',
  description: 'Candidate reads text aloud',
  sections: [
    {
      id: 'content',
      title: 'Passage',
      fields: {
        instruction: {
          type: 'textarea',
          label: 'Instruction',
          placeholder: 'Read the passage aloud'
        },
        content: {
          type: 'richtext',
          label: 'Passage to read *',
          required: true
        }
      }
    },
    {
      id: 'media',
      title: 'Reference Media',
      fields: {
        referenceAudio: {
          type: 'upload',
          label: 'Reference audio (optional)'
        }
      }
    },
    {
      id: 'timing',
      title: 'Timing',
      layout: 'grid',
      columns: 2,
      fields: {
        preparationTime: {
          type: 'number',
          label: 'Preparation time (seconds)',
          validation: { min: 0, max: 120 }
        },
        recordingTime: {
          type: 'number',
          label: 'Recording time (seconds)',
          validation: { min: 10, max: 180 }
        }
      }
    },
    {
      id: 'scoring',
      title: 'Scoring Rubric',
      fields: {
        rubric: {
          type: 'textarea',
          label: 'Scoring criteria'
        }
      }
    }
  ]
}

export const REPEAT_SENTENCE_SCHEMA: QuestionBuilderSchema = {
  type: 'repeat_sentence',
  label: 'Repeat Sentence',
  description: 'Listen and repeat sentence',
  sections: [
    {
      id: 'audio',
      title: 'Audio & Transcript',
      fields: {
        instruction: {
          type: 'textarea',
          label: 'Instruction'
        },
        audio: {
          type: 'upload',
          label: 'Audio file *',
          required: true
        },
        referenceTranscript: {
          type: 'textarea',
          label: 'Reference transcript *',
          required: true
        }
      }
    },
    {
      id: 'timing',
      title: 'Timing',
      layout: 'grid',
      columns: 3,
      fields: {
        audioReplayLimit: {
          type: 'number',
          label: 'Replay limit',
          validation: { min: 1, max: 10 }
        },
        preparationTime: {
          type: 'number',
          label: 'Prep time (seconds)',
          validation: { min: 0, max: 60 }
        },
        recordingTime: {
          type: 'number',
          label: 'Recording time (seconds)',
          validation: { min: 5, max: 120 }
        }
      }
    }
  ]
}

export const DESCRIBE_IMAGE_SCHEMA: QuestionBuilderSchema = {
  type: 'describe_image',
  label: 'Describe Image',
  description: 'Candidate describes an image',
  sections: [
    {
      id: 'content',
      title: 'Image & Instructions',
      fields: {
        instruction: {
          type: 'textarea',
          label: 'Instruction'
        },
        image: {
          type: 'upload',
          label: 'Image to describe *',
          required: true
        }
      }
    },
    {
      id: 'keypoints',
      title: 'Key Points (optional)',
      fields: {
        keyPoints: {
          type: 'textarea',
          label: 'Suggested key points for description'
        }
      }
    },
    {
      id: 'timing',
      title: 'Timing',
      layout: 'grid',
      columns: 2,
      fields: {
        preparationTime: {
          type: 'number',
          label: 'Preparation time (seconds)',
          validation: { min: 0, max: 120 }
        },
        recordingTime: {
          type: 'number',
          label: 'Recording time (seconds)',
          validation: { min: 10, max: 180 }
        }
      }
    }
  ]
}

export const RE_TELL_LECTURE_SCHEMA: QuestionBuilderSchema = {
  type: 're_tell_lecture',
  label: 'Re-tell Lecture',
  description: 'Candidate retells a lecture',
  sections: [
    {
      id: 'media',
      title: 'Lecture Media',
      fields: {
        instruction: {
          type: 'textarea',
          label: 'Instruction'
        },
        lectureAudio: {
          type: 'upload',
          label: 'Lecture audio/video *',
          required: true
        }
      }
    },
    {
      id: 'notes',
      title: 'Support Materials (optional)',
      fields: {
        notes: {
          type: 'textarea',
          label: 'Notes or transcript'
        },
        image: {
          type: 'upload',
          label: 'Supporting image'
        }
      }
    },
    {
      id: 'timing',
      title: 'Timing',
      layout: 'grid',
      columns: 2,
      fields: {
        preparationTime: {
          type: 'number',
          label: 'Preparation time (seconds)',
          validation: { min: 0, max: 180 }
        },
        recordingTime: {
          type: 'number',
          label: 'Recording time (seconds)',
          validation: { min: 20, max: 300 }
        }
      }
    }
  ]
}

export const ANSWER_SHORT_QUESTION_SCHEMA: QuestionBuilderSchema = {
  type: 'answer_short_question',
  label: 'Answer Short Question',
  description: 'Candidate answers question briefly',
  sections: [
    {
      id: 'question',
      title: 'Question',
      fields: {
        instruction: {
          type: 'textarea',
          label: 'Instruction'
        },
        questionAudio: {
          type: 'upload',
          label: 'Question audio *',
          required: true
        },
        questionText: {
          type: 'textarea',
          label: 'Question text'
        }
      }
    },
    {
      id: 'answers',
      title: 'Accepted Answers',
      fields: {
        acceptedAnswers: {
          type: 'options-list',
          label: 'List of accepted answers *',
          required: true
        },
        caseSensitive: {
          type: 'checkbox',
          label: 'Case sensitive'
        }
      }
    },
    {
      id: 'timing',
      title: 'Timing',
      layout: 'grid',
      columns: 2,
      fields: {
        preparationTime: {
          type: 'number',
          label: 'Preparation time (seconds)',
          validation: { min: 0, max: 30 }
        },
        recordingTime: {
          type: 'number',
          label: 'Recording time (seconds)',
          validation: { min: 5, max: 30 }
        }
      }
    }
  ]
}

export const PERSONAL_INTRODUCTION_SCHEMA: QuestionBuilderSchema = {
  type: 'personal_introduction',
  label: 'Personal Introduction',
  description: 'Candidate introduces themselves',
  sections: [
    {
      id: 'content',
      title: 'Instructions',
      fields: {
        instruction: {
          type: 'textarea',
          label: 'Instruction *',
          required: true,
          placeholder: 'Introduce yourself in 30-60 seconds'
        }
      }
    },
    {
      id: 'topics',
      title: 'Optional Topics',
      fields: {
        topics: {
          type: 'options-list',
          label: 'Suggested topics to cover'
        }
      }
    },
    {
      id: 'timing',
      title: 'Timing',
      layout: 'grid',
      columns: 2,
      fields: {
        preparationTime: {
          type: 'number',
          label: 'Preparation time (seconds)',
          validation: { min: 0, max: 60 }
        },
        recordingTime: {
          type: 'number',
          label: 'Recording time (seconds)',
          validation: { min: 20, max: 120 }
        }
      }
    }
  ]
}

export const SUMMARIZE_GROUP_DISCUSSION_SCHEMA: QuestionBuilderSchema = {
  type: 'summarize_group_discussion',
  label: 'Summarize Discussion',
  description: 'Summarize group discussion',
  sections: [
    {
      id: 'media',
      title: 'Discussion Media',
      fields: {
        instruction: {
          type: 'textarea',
          label: 'Instruction'
        },
        discussionAudio: {
          type: 'upload',
          label: 'Discussion audio *',
          required: true
        },
        transcript: {
          type: 'textarea',
          label: 'Discussion transcript (optional)'
        }
      }
    },
    {
      id: 'constraints',
      title: 'Word Limits',
      layout: 'grid',
      columns: 2,
      fields: {
        minWords: {
          type: 'number',
          label: 'Minimum words',
          validation: { min: 0 }
        },
        maxWords: {
          type: 'number',
          label: 'Maximum words',
          validation: { min: 0 }
        }
      }
    },
    {
      id: 'timing',
      title: 'Timing',
      layout: 'grid',
      columns: 2,
      fields: {
        preparationTime: {
          type: 'number',
          label: 'Preparation time (seconds)',
          validation: { min: 0, max: 180 }
        },
        recordingTime: {
          type: 'number',
          label: 'Recording time (seconds)',
          validation: { min: 20, max: 300 }
        }
      }
    }
  ]
}

export const RESPOND_TO_SITUATION_SCHEMA: QuestionBuilderSchema = {
  type: 'respond_to_situation',
  label: 'Respond to Situation',
  description: 'Respond to a given scenario',
  sections: [
    {
      id: 'scenario',
      title: 'Scenario',
      fields: {
        scenario: {
          type: 'richtext',
          label: 'Scenario description *',
          required: true
        }
      }
    },
    {
      id: 'media',
      title: 'Media (optional)',
      fields: {
        image: {
          type: 'upload',
          label: 'Supporting image'
        },
        audio: {
          type: 'upload',
          label: 'Supporting audio'
        }
      }
    },
    {
      id: 'guidelines',
      title: 'Response Guidelines',
      fields: {
        guidelines: {
          type: 'textarea',
          label: 'Expected response guidelines'
        }
      }
    },
    {
      id: 'timing',
      title: 'Timing',
      layout: 'grid',
      columns: 2,
      fields: {
        preparationTime: {
          type: 'number',
          label: 'Preparation time (seconds)',
          validation: { min: 0, max: 120 }
        },
        recordingTime: {
          type: 'number',
          label: 'Recording time (seconds)',
          validation: { min: 10, max: 180 }
        }
      }
    }
  ]
}

// ============================================================
// READING TYPES
// ============================================================

export const READING_MULTIPLE_CHOICE_SCHEMA: QuestionBuilderSchema = {
  type: 'multiple_choice_single',
  label: 'Reading Multiple Choice',
  description: 'Multiple choice reading comprehension',
  sections: [
    {
      id: 'passage',
      title: 'Reading Passage',
      fields: {
        passage: {
          type: 'richtext',
          label: 'Passage *',
          required: true
        }
      }
    },
    {
      id: 'question',
      title: 'Question',
      fields: {
        content: {
          type: 'textarea',
          label: 'Question *',
          required: true
        }
      }
    },
    {
      id: 'options',
      title: 'Answer Options',
      fields: {
        optionsList: {
          type: 'options-list',
          label: 'Options *',
          required: true
        }
      }
    }
  ]
}

export const RE_ORDER_PARAGRAPHS_SCHEMA: QuestionBuilderSchema = {
  type: 're_order_paragraphs',
  label: 'Re-order Paragraphs',
  description: 'Arrange paragraphs in correct order',
  sections: [
    {
      id: 'instruction',
      title: 'Instruction',
      fields: {
        instruction: {
          type: 'textarea',
          label: 'Instruction',
          placeholder: 'Arrange the following paragraphs in the correct order'
        }
      }
    },
    {
      id: 'paragraphs',
      title: 'Paragraphs',
      fields: {
        paragraphs: {
          type: 'options-list',
          label: 'Paragraph blocks (drag to reorder) *',
          required: true
        }
      }
    }
  ]
}

// ============================================================
// LISTENING TYPES
// ============================================================

export const SUMMARIZE_SPOKEN_TEXT_SCHEMA: QuestionBuilderSchema = {
  type: 'summarize_spoken_text',
  label: 'Summarize Spoken Text',
  description: 'Listen and summarize in writing',
  sections: [
    {
      id: 'audio',
      title: 'Audio Content',
      fields: {
        instruction: {
          type: 'textarea',
          label: 'Instruction'
        },
        audio: {
          type: 'upload',
          label: 'Audio file *',
          required: true
        },
        transcript: {
          type: 'textarea',
          label: 'Transcript (optional)'
        }
      }
    },
    {
      id: 'constraints',
      title: 'Word Limits',
      layout: 'grid',
      columns: 2,
      fields: {
        minWords: {
          type: 'number',
          label: 'Minimum words',
          validation: { min: 0 }
        },
        maxWords: {
          type: 'number',
          label: 'Maximum words',
          validation: { min: 0 }
        }
      }
    }
  ]
}

export const HIGHLIGHT_CORRECT_SUMMARY_SCHEMA: QuestionBuilderSchema = {
  type: 'highlight_correct_summary',
  label: 'Highlight Correct Summary',
  description: 'Select the correct summary',
  sections: [
    {
      id: 'audio',
      title: 'Audio Content',
      fields: {
        instruction: {
          type: 'textarea',
          label: 'Instruction'
        },
        audio: {
          type: 'upload',
          label: 'Audio file *',
          required: true
        }
      }
    },
    {
      id: 'options',
      title: 'Summary Options',
      fields: {
        optionsList: {
          type: 'options-list',
          label: 'Summary options *',
          required: true
        }
      }
    }
  ]
}

export const SELECT_MISSING_WORD_SCHEMA: QuestionBuilderSchema = {
  type: 'select_missing_word',
  label: 'Select Missing Word',
  description: 'Select missing word from options',
  sections: [
    {
      id: 'audio',
      title: 'Audio Content',
      fields: {
        instruction: {
          type: 'textarea',
          label: 'Instruction'
        },
        audio: {
          type: 'upload',
          label: 'Audio file *',
          required: true
        }
      }
    },
    {
      id: 'content',
      title: 'Transcript & Missing Word',
      fields: {
        transcript: {
          type: 'code-editor',
          label: 'Transcript with [[blank_1]] *',
          required: true,
          placeholder: 'The boy went to [[blank_1]] yesterday.'
        }
      }
    },
    {
      id: 'options',
      title: 'Word Options',
      fields: {
        optionsList: {
          type: 'options-list',
          label: 'Answer options *',
          required: true
        }
      }
    }
  ]
}

export const WRITE_FROM_DICTATION_SCHEMA: QuestionBuilderSchema = {
  type: 'write_from_dictation',
  label: 'Write from Dictation',
  description: 'Listen and write exactly',
  sections: [
    {
      id: 'audio',
      title: 'Audio Content',
      fields: {
        instruction: {
          type: 'textarea',
          label: 'Instruction'
        },
        audio: {
          type: 'upload',
          label: 'Audio file *',
          required: true
        }
      }
    },
    {
      id: 'answer',
      title: 'Reference Sentence',
      fields: {
        referenceSentence: {
          type: 'textarea',
          label: 'Correct sentence *',
          required: true
        }
      }
    },
    {
      id: 'rules',
      title: 'Acceptance Rules (optional)',
      fields: {
        caseSensitive: {
          type: 'checkbox',
          label: 'Case sensitive'
        },
        acceptedVariations: {
          type: 'textarea',
          label: 'Accepted variations (comma-separated)'
        }
      }
    }
  ]
}

// ============================================================
// SCHEMA REGISTRY
// ============================================================

export const QUESTION_SCHEMAS: Record<QuestionType, QuestionBuilderSchema> = {
  // Basic
  mcq: MULTIPLE_CHOICE_SCHEMA,
  fill_in_blank: FILL_IN_BLANK_SCHEMA,
  essay: ESSAY_SCHEMA,
  matching: MATCHING_SCHEMA,
  true_false: TRUE_FALSE_SCHEMA,

  // Speaking & Writing
  personal_introduction: PERSONAL_INTRODUCTION_SCHEMA,
  read_aloud: READ_ALOUD_SCHEMA,
  repeat_sentence: REPEAT_SENTENCE_SCHEMA,
  describe_image: DESCRIBE_IMAGE_SCHEMA,
  re_tell_lecture: RE_TELL_LECTURE_SCHEMA,
  answer_short_question: ANSWER_SHORT_QUESTION_SCHEMA,
  summarize_group_discussion: SUMMARIZE_GROUP_DISCUSSION_SCHEMA,
  respond_to_situation: RESPOND_TO_SITUATION_SCHEMA,

  // Reading
  multiple_choice_single: READING_MULTIPLE_CHOICE_SCHEMA,
  re_order_paragraphs: RE_ORDER_PARAGRAPHS_SCHEMA,

  // Listening
  summarize_spoken_text: SUMMARIZE_SPOKEN_TEXT_SCHEMA,
  highlight_correct_summary: HIGHLIGHT_CORRECT_SUMMARY_SCHEMA,
  select_missing_word: SELECT_MISSING_WORD_SCHEMA,
  write_from_dictation: WRITE_FROM_DICTATION_SCHEMA
}

export function getQuestionSchema(type: QuestionType): QuestionBuilderSchema {
  return QUESTION_SCHEMAS[type]
}
