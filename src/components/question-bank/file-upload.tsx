'use client'

import { useState } from 'react'
import { Upload, X } from 'lucide-react'

interface FileUploadProps {
  accept: string
  maxSize?: number // in MB
  onFilesSelect: (files: File[]) => void
  multiple?: boolean
}

export function FileUpload({
  accept,
  maxSize = 50,
  onFilesSelect,
  multiple = false
}: FileUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }

  const validateAndAddFiles = (files: FileList) => {
    const validFiles: File[] = []
    const errors: string[] = []

    Array.from(files).forEach((file) => {
      if (file.size > maxSize * 1024 * 1024) {
        errors.push(`${file.name} exceeds ${maxSize}MB`)
        return
      }
      validFiles.push(file)
    })

    if (errors.length > 0) {
      alert(errors.join('\n'))
    }

    const newFiles = multiple
      ? [...selectedFiles, ...validFiles]
      : validFiles.slice(0, 1)

    setSelectedFiles(newFiles)
    onFilesSelect(newFiles)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    validateAndAddFiles(e.dataTransfer.files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAddFiles(e.target.files)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    onFilesSelect(newFiles)
  }

  return (
    <div className="space-y-3">
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          dragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
        }`}
      >
        <div className="text-center">
          <Upload className="mx-auto mb-2 text-zinc-400" size={32} />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Drag files here or click to browse
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Max {maxSize}MB per file
          </p>
        </div>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />
      </label>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Selected files:
          </p>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-zinc-100 dark:bg-zinc-900 rounded"
            >
              <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                {file.name}
              </span>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
