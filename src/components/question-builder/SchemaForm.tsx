'use client'

import { useState } from 'react'
import type { QuestionBuilderSchema, SectionConfig, FieldConfig } from '@/lib/question-schemas'

interface SchemaFormProps {
  schema: QuestionBuilderSchema
  data: Record<string, any>
  onChange: (field: string, value: any) => void
  errors?: Record<string, string>
}

export function SchemaForm({ schema, data, onChange, errors = {} }: SchemaFormProps) {
  const [expandedSection, setExpandedSection] = useState<string>(schema.sections[0]?.id)

  return (
    <div className="space-y-4">
      {schema.sections.map((section) => (
        <div
          key={section.id}
          className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        >
          {/* Section Header */}
          <button
            onClick={() =>
              setExpandedSection(expandedSection === section.id ? '' : section.id)
            }
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
          >
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-white text-left">
                {section.title}
              </h3>
              {section.description && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-left mt-1">
                  {section.description}
                </p>
              )}
            </div>
            <div
              className={`transition-transform ${
                expandedSection === section.id ? 'rotate-180' : ''
              }`}
            >
              <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </button>

          {/* Section Content */}
          {expandedSection === section.id && (
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <div
                className={
                  section.layout === 'grid'
                    ? `grid gap-4 ${
                        section.columns === 3 ? 'grid-cols-3' : section.columns === 2 ? 'grid-cols-2' : 'grid-cols-1'
                      }`
                    : section.layout === 'tabs'
                    ? 'space-y-4'
                    : 'space-y-4'
                }
              >
                {Object.entries(section.fields).map(([fieldName, fieldConfig]) => (
                  <FieldRenderer
                    key={fieldName}
                    name={fieldName}
                    config={fieldConfig}
                    value={data[fieldName]}
                    onChange={(value) => onChange(fieldName, value)}
                    error={errors[fieldName]}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

interface FieldRendererProps {
  name: string
  config: FieldConfig
  value: any
  onChange: (value: any) => void
  error?: string
}

function FieldRenderer({
  name,
  config,
  value,
  onChange,
  error
}: FieldRendererProps) {
  const { type, label, placeholder, required, description, options, validation } = config

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'text' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      )}

      {type === 'textarea' && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      )}

      {type === 'richtext' && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      )}

      {type === 'code-editor' && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-900 text-zinc-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      )}

      {type === 'number' && (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
          placeholder={placeholder}
          min={validation?.min}
          max={validation?.max}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      )}

      {type === 'select' && (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Select...</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {type === 'checkbox' && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{description}</span>
        </label>
      )}

      {type === 'upload' && (
        <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onChange(file)
            }}
            className="hidden"
            id={name}
          />
          <label htmlFor={name} className="cursor-pointer block">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {value?.name ? (
                <>
                  <div className="font-medium text-green-600 dark:text-green-400">
                    {value.name}
                  </div>
                  <div className="text-xs mt-1">Click to change</div>
                </>
              ) : (
                <>
                  <div>Drop file here or click to browse</div>
                  {description && <div className="text-xs mt-1">{description}</div>}
                </>
              )}
            </div>
          </label>
        </div>
      )}

      {type === 'options-list' && (
        <OptionsListField
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
      )}

      {description && type !== 'checkbox' && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{description}</p>
      )}
    </div>
  )
}

interface OptionsListFieldProps {
  value: any
  onChange: (value: any) => void
  placeholder?: string
}

function OptionsListField({
  value = [],
  onChange,
  placeholder
}: OptionsListFieldProps) {
  const items = Array.isArray(value) ? value : []
  // Detect whether items are objects (with content/isCorrect) or simple strings
  const isObjectItems = items.length > 0 ? typeof items[0] === 'object' : true

  const addItem = () => {
    if (isObjectItems) onChange([...items, { content: '', isCorrect: false }])
    else onChange([...items, ''])
  }

  const updateItem = (index: number, fieldOrValue: string, fieldValue?: any) => {
    const newItems = [...items]
    if (isObjectItems) {
      const field = fieldOrValue
      newItems[index] = { ...newItems[index], [field]: fieldValue }
    } else {
      newItems[index] = fieldOrValue
    }
    onChange(newItems)
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_: any, i: number) => i !== index))
  }

  return (
    <div className="space-y-2">
      {items.map((item: any, index: number) => (
        <div key={index} className="flex gap-2">
          {isObjectItems ? (
            <>
              <input
                type="checkbox"
                checked={item.isCorrect || false}
                onChange={(e) => updateItem(index, 'isCorrect', e.target.checked)}
                className="mt-2 w-4 h-4"
                title="Mark as correct"
              />
              <textarea
                value={item.content || ''}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder={placeholder || `Item ${index + 1}`}
                rows={2}
                className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </>
          ) : (
            <>
              <textarea
                value={item || ''}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder={placeholder || `Item ${index + 1}`}
                rows={2}
                className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </>
          )}

          <button
            type="button"
            onClick={() => removeItem(index)}
            className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            Delete
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors text-sm font-medium"
      >
        + Add Item
      </button>
    </div>
  )
}
