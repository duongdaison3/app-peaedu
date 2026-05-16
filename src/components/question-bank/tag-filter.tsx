'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface TagFilterProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  availableTags?: string[]
}

export function TagFilter({
  selectedTags,
  onTagsChange,
  availableTags = []
}: TagFilterProps) {
  const [searchValue, setSearchValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.toLowerCase().includes(searchValue.toLowerCase()) &&
      !selectedTags.includes(tag)
  )

  const addTag = (tag: string) => {
    onTagsChange([...selectedTags, tag])
    setSearchValue('')
    setShowDropdown(false)
  }

  const removeTag = (tag: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Tags
      </label>

      <div className="relative">
        <div className="flex flex-wrap gap-2 p-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 min-h-10">
          {selectedTags.map((tag) => (
            <div
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded text-sm"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded p-0.5"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          <input
            type="text"
            placeholder="Search tags..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            className="flex-1 min-w-24 outline-none bg-transparent text-zinc-900 dark:text-white placeholder-zinc-500"
          />
        </div>

        {showDropdown && filteredTags.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-lg z-50">
            {filteredTags.map((tag) => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                className="w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
