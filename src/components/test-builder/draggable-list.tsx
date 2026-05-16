'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface SortableItemProps {
  id: string
  item: any
  renderItem: (item: any) => React.ReactNode
}

function SortableItem({ id, item, renderItem }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`transition-all ${isDragging ? 'opacity-50 scale-95' : 'scale-100'}`}
    >
      <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">
        <div {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical size={18} className="text-zinc-400" />
        </div>
        <div className="flex-1">{renderItem(item)}</div>
      </div>
    </div>
  )
}

interface DraggableListProps {
  items: any[]
  onReorder: (newOrder: string[]) => void
  renderItem: (item: any) => React.ReactNode
  itemIdField?: string
  className?: string
}

export function DraggableList({
  items,
  onReorder,
  renderItem,
  itemIdField = 'id',
  className = '',
}: DraggableListProps) {
  const [localItems, setLocalItems] = useState(items)

  useEffect(() => {
    setLocalItems(items)
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex(
        (item) => item[itemIdField] === active.id
      )
      const newIndex = localItems.findIndex((item) => item[itemIdField] === over.id)

      const newItems = arrayMove(localItems, oldIndex, newIndex)
      setLocalItems(newItems)
      onReorder(newItems.map((item) => item[itemIdField]))
    }
  }

  const itemIds = localItems.map((item) => item[itemIdField])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className={`space-y-2 ${className}`}>
          {localItems.map((item) => (
            <SortableItem
              key={item[itemIdField]}
              id={item[itemIdField]}
              item={item}
              renderItem={renderItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
