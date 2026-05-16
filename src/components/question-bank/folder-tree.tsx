'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, FolderOpen, FolderPlus, Trash2 } from 'lucide-react'
import { getQuestionFolders, createQuestionFolder } from '@/modules/assessment/actions'

interface Folder {
  id: string
  title: string
  children?: Folder[]
  _count?: { questions: number }
}

interface FolderTreeProps {
  onFolderSelect: (folderId: string | null) => void
  selectedFolderId: string | null
  onRefresh?: () => void
}

export function FolderTree({ onFolderSelect, selectedFolderId, onRefresh }: FolderTreeProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async () => {
    try {
      setLoading(true)
      const folderList = await getQuestionFolders()
      setFolders(folderList as Folder[])
    } catch (error) {
      console.error('Error loading folders:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const handleCreateFolder = async (parentId: string | null = null) => {
    if (!newFolderName.trim()) return

    try {
      await createQuestionFolder(newFolderName, parentId || undefined)
      setNewFolderName('')
      setNewFolderParentId(null)
      await loadFolders()
      onRefresh?.()
    } catch (error) {
      console.error('Error creating folder:', error)
    }
  }

  const renderFolderTree = (folderList: Folder[], level = 0) => {
    return (
      <div className="space-y-1">
        {folderList.map((folder) => (
          <div key={folder.id}>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                selectedFolderId === folder.id
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              style={{ marginLeft: `${level * 12}px` }}
            >
              <button
                onClick={() => toggleFolder(folder.id)}
                className="p-0 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
              >
                {expandedFolders.has(folder.id) ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>

              <FolderOpen size={16} className="text-blue-500" />

              <button
                onClick={() => onFolderSelect(folder.id)}
                className="flex-1 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {folder.title}
              </button>

              <span className="text-xs text-zinc-500">
                {folder._count?.questions || 0}
              </span>
            </div>

            {expandedFolders.has(folder.id) && folder.children && folder.children.length > 0 && (
              <div>
                {renderFolderTree(folder.children, level + 1)}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
            Folders
          </h3>

          {/* All Questions */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
              selectedFolderId === null
                ? 'bg-blue-100 dark:bg-blue-900'
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            onClick={() => onFolderSelect(null)}
          >
            <FolderOpen size={16} className="text-blue-500" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              All Questions
            </span>
          </div>

          {/* Folder Tree */}
          {loading ? (
            <div className="text-sm text-zinc-500 py-4">Loading...</div>
          ) : (
            renderFolderTree(folders)
          )}
        </div>

        {/* Create New Folder */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <button
            onClick={() => setNewFolderParentId(newFolderParentId === null ? 'root' : null)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md w-full"
          >
            <FolderPlus size={16} />
            New Folder
          </button>

          {newFolderParentId !== null && (
            <div className="mt-2 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-md space-y-2">
              <input
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleCreateFolder(newFolderParentId === 'root' ? null : newFolderParentId)}
                  className="flex-1 px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setNewFolderParentId(null)
                    setNewFolderName('')
                  }}
                  className="flex-1 px-2 py-1 text-sm bg-zinc-300 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded hover:bg-zinc-400 dark:hover:bg-zinc-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
