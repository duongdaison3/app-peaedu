# Question Builder - Modular Schema-Driven Architecture

## Overview

The new question builder implements a **modular, schema-driven, dynamic form renderer** pattern that supports 18+ question types across 4 categories (Basic, Speaking & Writing, Reading, Listening).

## Key Features

### 1. **Schema-Driven Design**
- Each question type has a schema (`question-schemas.ts`) defining its UI structure
- Schemas are configuration-based, not code-based
- Easy to add new question types without modifying components

### 2. **Modular Components**
```
QuestionBuilder (Main wrapper)
├── QuestionSettings (Left panel: Type, Skill, Difficulty, Tags)
├── SchemaForm (Center: Dynamic form renderer)
└── ScoringPanel (Right: Score, Explanation)
```

### 3. **5 Fixed Sections Per Question**
1. **Question Settings** - Metadata (type, skill, difficulty, tags)
2. **Prompt / Content** - Question text, instructions
3. **Media** - Upload audio/images
4. **Answer Configuration** - Options, correct answers, timing
5. **Scoring & Constraints** - Score value, rubric, word limits

### 4. **3-Column Layout**
```
┌─────────────────────────────────────────────────┐
│  LEFT (25%)  │  CENTER (50%)  │  RIGHT (25%)    │
├──────────────┼────────────────┼─────────────────┤
│  Settings    │  Main Builder  │  Scoring        │
│  - Type      │  - Sections    │  - Score        │
│  - Skill     │  - Fields      │  - Explanation  │
│  - Tags      │  - Validation  │                 │
└─────────────────────────────────────────────────┘
```

## File Structure

```
src/
├── lib/
│   ├── question-types.ts          (Question type config - existing)
│   └── question-schemas.ts        (Schema definitions - NEW)
│
├── components/
│   ├── question-builder/          (NEW module)
│   │   ├── index.ts               (Exports)
│   │   ├── QuestionBuilder.tsx     (Main wrapper)
│   │   ├── QuestionSettings.tsx    (Left panel)
│   │   └── SchemaForm.tsx          (Center: dynamic renderer)
│   │
│   └── question-bank/
│       └── question-form.tsx       (Thin wrapper - updated)
│
└── modules/assessment/
    └── actions.ts                 (Server actions - updated)
```

## Component Usage

### QuestionForm (Simple Wrapper)
```tsx
import { QuestionForm } from '@/components/question-bank/question-form'

<QuestionForm
  folderId="folder-id"
  question={existingQuestion}
  onSuccess={() => console.log('saved')}
  onClose={() => setOpen(false)}
/>
```

### QuestionBuilder (Main Component)
```tsx
import { QuestionBuilder } from '@/components/question-builder'

export function QuestionModal({ onClose, onSuccess }) {
  return (
    <QuestionBuilder
      folderId="folder-id"
      onSuccess={onSuccess}
      onClose={onClose}
    />
  )
}
```

## Schema System

### QuestionBuilderSchema Structure
```typescript
{
  type: 'read_aloud'           // Question type enum
  label: 'Read Aloud'          // Display name
  description: 'string'        // UI description
  sections: [                  // Array of form sections
    {
      id: 'content'            // Unique section ID
      title: 'Passage'         // Section heading
      description?: 'string'   // Optional explanation
      fields: {                // Field definitions
        instruction: {
          type: 'textarea'
          label: 'Instruction'
          required: false
        },
        content: {
          type: 'richtext'
          label: 'Passage to read *'
          required: true
        }
      }
      layout?: 'grid' | 'stack' | 'tabs'
      columns?: 1 | 2 | 3
    }
  ]
}
```

### FieldConfig Types
```typescript
type: 'text'           // Single line input
     | 'textarea'      // Multi-line text
     | 'richtext'      // Rich text editor
     | 'code-editor'   // Code/monospace
     | 'number'        // Number input
     | 'select'        // Dropdown
     | 'checkbox'      // Toggle checkbox
     | 'upload'        // File upload
     | 'options-list'  // Dynamic options
```

### Example Schema: Read Aloud
```typescript
{
  type: 'read_aloud',
  label: 'Read Aloud',
  sections: [
    {
      id: 'content',
      title: 'Passage',
      fields: {
        instruction: { type: 'textarea', label: 'Instruction' },
        content: { type: 'richtext', label: 'Passage to read *', required: true }
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
```

## Supported Question Types

### Basic (5 types)
- Multiple Choice (MCQ)
- Fill in the Blank
- Essay
- Matching
- True / False

### Speaking & Writing (8 types)
- Personal Introduction
- Read Aloud
- Repeat Sentence
- Describe Image
- Re-tell Lecture
- Answer Short Question
- Summarize Group Discussion
- Respond to Situation

### Reading (2 types)
- Multiple Choice (Reading)
- Re-order Paragraphs

### Listening (4 types)
- Summarize Spoken Text
- Highlight Correct Summary
- Select Missing Word
- Write from Dictation

## Database Schema

### Questions Table
```sql
questions {
  id              UUID primary key
  folderId        UUID foreign key
  type            QuestionType enum
  skill           QuestionSkill enum
  difficulty      QuestionDifficulty enum
  title           String
  content         Text              -- Legacy field (populated from config_json.content)
  explanation     Text
  score           Float default 1.0
  configJson      JSON              -- Schema-driven configuration
  createdBy       UUID foreign key
  createdAt       DateTime
  updatedAt       DateTime
}
```

### ConfigJson Structure
```json
{
  "prompt": "...",
  "instruction": "...",
  "content": "...",
  "options": [...],
  "audio": "file-reference",
  "image": "file-reference",
  "preparationTime": 30,
  "recordingTime": 60,
  "minWords": 50,
  "maxWords": 100,
  "explanation": "...",
  ...
}
```

## Dynamic Form Rendering

### SchemaForm Component
```tsx
<SchemaForm
  schema={schema}              // QuestionBuilderSchema
  data={formData}              // Current form values
  onChange={handleChange}      // Update handler
  errors={validationErrors}    // Show error messages
/>
```

### How It Works
1. Receives schema definition
2. Renders sections as collapsible panels
3. For each field, renders appropriate input type
4. Shows validation errors inline
5. Supports grid/stack layouts

### Validation Flow
1. User submits form
2. `validateForm()` checks required fields
3. Collects errors in `errors` object
4. Displays inline error messages
5. Prevents submission if invalid

## Server Actions (Updated)

### createQuestion
```typescript
await createQuestion({
  folderId: string,
  type: QuestionType,
  skill: QuestionSkill,
  difficulty: QuestionDifficulty,
  title: string,
  tags: string[],
  config_json: Record<string, any>,  // Schema data
  score: number
})
```

### updateQuestion
```typescript
await updateQuestion(questionId, {
  type: QuestionType,
  skill: QuestionSkill,
  difficulty: QuestionDifficulty,
  title: string,
  tags: string[],
  config_json: Record<string, any>,  // Schema data
  score: number
})
```

## Adding a New Question Type

### Step 1: Add Schema in `question-schemas.ts`
```typescript
export const MY_TYPE_SCHEMA: QuestionBuilderSchema = {
  type: 'my_type',
  label: 'My Question Type',
  description: 'Description',
  sections: [
    {
      id: 'content',
      title: 'Content',
      fields: {
        content: {
          type: 'textarea',
          label: 'Question Content *',
          required: true
        }
      }
    }
  ]
}

// Add to registry
export const QUESTION_SCHEMAS: Record<QuestionType, QuestionBuilderSchema> = {
  // ... existing types
  my_type: MY_TYPE_SCHEMA,
}
```

### Step 2: Add to Prisma Enum
```prisma
enum QuestionType {
  // ... existing types
  my_type
}
```

### Step 3: Rebuild
```bash
npx prisma generate
npm run build
```

The form will automatically support the new type!

## Layout Customization

### Grid Layout
```typescript
{
  layout: 'grid',
  columns: 2,  // or 1, 2, 3
  fields: { ... }
}
```

### Stack Layout (Default)
```typescript
{
  layout: 'stack',
  fields: { ... }
}
```

### Tabs Layout
```typescript
{
  layout: 'tabs',
  fields: { ... }
}
```

## Field Validation

### Built-in Validation Types
```typescript
validation: {
  minLength?: number
  maxLength?: number
  min?: number           // For numbers
  max?: number           // For numbers
  required?: boolean
  pattern?: string       // Regex pattern
}
```

### Custom Validation
Extend `validateForm()` in QuestionBuilder component:
```typescript
const validateForm = (): boolean => {
  // ... existing validation
  
  // Custom rules
  if (type === 'essay' && formData.minWords > formData.maxWords) {
    newErrors.maxWords = 'Max words must be greater than min'
  }
  
  return Object.keys(newErrors).length === 0
}
```

## Future Enhancements

### 1. **Rich Text Editor**
- Replace textarea with Monaco or TipTap
- Support formatting, images, code blocks

### 2. **Drag & Drop**
- Reorder options/paragraphs with drag-drop
- Visual feedback during drag

### 3. **Media Library**
- Browse existing media files
- Upload directly from form
- Preview before saving

### 4. **Question Templates**
- Save template from existing question
- Bulk create from template
- Share templates across instructors

### 5. **Preview Panel**
- Real-time preview of question as student sees it
- Toggle between edit and preview mode
- Test interactions

### 6. **Collaborative Editing**
- Multiple instructors editing same question
- Real-time sync
- Conflict resolution

### 7. **AI-Assisted**
- Generate questions from topic
- Auto-generate options/answers
- Improve grammar/clarity

## Troubleshooting

### Schema Not Rendering?
- Check `QUESTION_SCHEMAS` registry includes your type
- Verify schema has at least one section
- Console will show schema type in header

### Validation Not Working?
- Required fields marked with `required: true`
- Custom validation in `validateForm()` function
- Errors display inline below field

### File Upload Issues?
- Check `type: 'upload'` in field config
- Set `accept` and `maxSize` in FileUploadEnhanced component
- Verify file size under limit

### Type Errors?
- Ensure type matches QuestionType enum
- Check Prisma types generated: `npx prisma generate`
- Rebuild TypeScript: `npm run build`
