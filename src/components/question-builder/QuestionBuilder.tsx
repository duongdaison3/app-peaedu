'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { createQuestion, getQuestionFolders, updateQuestion } from '@/modules/assessment/actions'
import { getQuestionSchema } from '@/lib/question-schemas'
import { QuestionSettings } from './QuestionSettings'
import { SchemaForm } from './SchemaForm'
import type { QuestionType, QuestionSkill, QuestionDifficulty } from '@prisma/client'

type FolderItem = {
  id: string
  title: string
  children?: FolderItem[]
}

type FolderOption = {
  id: string
  title: string
  depth: number
}

function flattenFolders(folders: FolderItem[], depth = 0): FolderOption[] {
  return folders.flatMap((folder) => [
    {
      id: folder.id,
      title: folder.title,
      depth
    },
    ...(folder.children?.length ? flattenFolders(folder.children, depth + 1) : [])
  ])
}

interface QuestionBuilderProps {
  folderId?: string
  parentQuestionId?: string
  question?: any
  onSuccess?: () => void
  onClose?: () => void
}

export function QuestionBuilder({
  folderId,
  parentQuestionId,
  question,
  onSuccess,
  onClose
}: QuestionBuilderProps) {
  const [type, setType] = useState<QuestionType>(question?.type || ('mcq' as QuestionType))
  const [skill, setSkill] = useState<QuestionSkill>(question?.skill || ('reading' as QuestionSkill))
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(question?.difficulty || ('medium' as QuestionDifficulty))
  const [title, setTitle] = useState(question?.title || '')
  const [tags, setTags] = useState(question?.tags?.map((t: any) => t.tag?.name || t) || [])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string>(folderId || question?.folderId || '')
  
  const [formData, setFormData] = useState<Record<string, any>>(
    question?.config_json || {}
  )
  
  const [loading, setLoading] = useState(false)
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const schema = getQuestionSchema(type)

  useEffect(() => {
    setSelectedFolderId(folderId || question?.folderId || '')
  }, [folderId, question?.folderId])

  useEffect(() => {
    const loadFolders = async () => {
      try {
        setLoadingFolders(true)
        const data = await getQuestionFolders()
        setFolders(data as FolderItem[])
      } catch (error) {
        console.error('Error loading question folders:', error)
      } finally {
        setLoadingFolders(false)
      }
    }

    void loadFolders()
  }, [])

  const folderOptions = flattenFolders(folders)
  const selectedFolderLabel = folderOptions.find((folder) => folder.id === selectedFolderId)?.title

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    schema.sections.forEach((section) => {
      Object.entries(section.fields).forEach(([fieldName, fieldConfig]) => {
        if (fieldConfig.required && !formData[fieldName]) {
          newErrors[fieldName] = `${fieldConfig.label} is required`
        }
      })
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // --- BƯỚC MỚI: Quét và upload file trước khi gọi server action ---
      const processedFormData = { ...formData }

      for (const [key, value] of Object.entries(processedFormData)) {
        // Kiểm tra xem trường dữ liệu này có phải là một File object không
        if (value instanceof File) {
          const uploadData = new FormData()
          // Sửa 'file' thành 'files' theo yêu cầu của API
          uploadData.append('files', value)
          
          // Xác định type dựa vào mime type của file
          const fileType = value.type.startsWith('audio/') ? 'audio' : 'image'
          uploadData.append('type', fileType)

          // Gọi API upload file của dự án
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: uploadData,
          })

          if (!uploadRes.ok) {
            const errorData = await uploadRes.json()
            throw new Error(`Upload thất bại cho trường ${key}: ${errorData.error}`)
          }

          const uploadResult = await uploadRes.json()
          
          // API trả về mảng 'files', ta lấy url của file đầu tiên
          if (uploadResult.files && uploadResult.files.length > 0) {
             processedFormData[key] = uploadResult.files[0].url 
          } else {
             throw new Error(`Không lấy được URL trả về cho trường ${key}`)
          }
        }
      }
      // -----------------------------------------------------------------

      const payload = {
        folderId: selectedFolderId || undefined,
        parentQuestionId,
        type,
        title,
        skill,
        difficulty,
        tags,
        // Đưa dữ liệu đã được làm sạch (chỉ chứa URL, không chứa File) xuống DB
        config_json: processedFormData 
      }

      if (question) {
        await updateQuestion(question.id, payload)
      } else {
        await createQuestion(payload)
      }

      onSuccess?.()
      onClose?.()
    } catch (error: any) {
      console.error('Error saving question:', error)
      alert(error.message || 'Error saving question. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-950 rounded-lg w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-950">
          <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {question ? 'Edit Question' : 'Create Question'}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {schema.label} - {schema.description}
              </p>
              <div className="mt-2 flex gap-2">
                {selectedFolderId && (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded">
                    Folder: {selectedFolderLabel || selectedFolderId}
                  </span>
                )}
                {parentQuestionId && (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded">
                    Child Question
                  </span>
                )}
              </div>
            </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Content - 3 Column Layout */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-12 gap-6 p-6">
            {/* Left Panel: Question Settings */}
            <div className="col-span-3 space-y-6">
              <QuestionSettings
                type={type}
                skill={skill}
                difficulty={difficulty}
                tags={tags}
                title={title}
                onTypeChange={setType}
                onSkillChange={setSkill}
                onDifficultyChange={setDifficulty}
                onTagsChange={setTags}
                onTitleChange={setTitle}
              />

              <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
                <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="font-medium text-zinc-900 dark:text-white">Question Folder</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Folder
                  </label>
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">No folder</option>
                    {folderOptions.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {`${'— '.repeat(folder.depth)}${folder.title}`}
                      </option>
                    ))}
                  </select>
                  {loadingFolders && (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Loading folders...</p>
                  )}
                </div>
              </div>

              {/* Right Panel: Scoring & Constraints */}
              <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
                <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="font-medium text-zinc-900 dark:text-white">Scoring</h3>
                </div>

                {/* Score */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Score Value
                  </label>
                  <input
                    type="number"
                    value={formData.score || 1}
                    onChange={(e) => handleFormChange('score', parseFloat(e.target.value) || 1)}
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Explanation (optional)
                  </label>
                  <textarea
                    value={formData.explanation || ''}
                    onChange={(e) => handleFormChange('explanation', e.target.value)}
                    rows={3}
                    placeholder="Help students understand the answer"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Center Panel: Main Builder */}
            <div className="col-span-9">
              <SchemaForm
                schema={schema}
                data={formData}
                onChange={handleFormChange}
                errors={errors}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 justify-end border-t border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50 dark:bg-zinc-900/50 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium"
          >
            {loading ? 'Saving...' : question ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
