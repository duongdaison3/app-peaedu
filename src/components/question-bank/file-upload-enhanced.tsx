'use client'

import { useState } from 'react'
import { Upload, X, AlertCircle } from 'lucide-react'

interface FileUploadProps {
  accept: string
  maxSize?: number // in MB
  onFilesSelect: (files: File[]) => void
  multiple?: boolean
  type?: 'audio' | 'image'
}

export function FileUploadEnhanced({
  accept,
  maxSize = 50,
  onFilesSelect,
  multiple = false,
  type = 'image'
}: FileUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [errors, setErrors] = useState<string[]>([])

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
    const newErrors: string[] = []

    Array.from(files).forEach((file) => {
      if (file.size > maxSize * 1024 * 1024) {
        newErrors.push(`${file.name} exceeds ${maxSize}MB`)
        return
      }

      const allowedTypes =
        type === 'audio'
          ? ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm']
          : ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

      if (!allowedTypes.includes(file.type)) {
        newErrors.push(`${file.name} has invalid file type`)
        return
      }

      validFiles.push(file)
    })

    setErrors(newErrors)

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

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      selectedFiles.forEach((file) => {
        formData.append('files', file)
      })
      formData.append('type', type)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      console.log('Upload successful:', data)
      setSelectedFiles([])
      onFilesSelect([])
      setUploadProgress({})
    } catch (error) {
      console.error('Upload error:', error)
      setErrors([
        ...errors,
        error instanceof Error ? error.message : 'Upload failed',
      ])
    } finally {
      setUploading(false)
    }
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
          disabled={uploading}
        />
      </label>

      {errors.length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-200">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Selected files ({selectedFiles.length}):
          </p>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-zinc-100 dark:bg-zinc-900 rounded"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={() => removeFile(index)}
                disabled={uploading}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
          ))}

          {selectedFiles.length > 0 && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
