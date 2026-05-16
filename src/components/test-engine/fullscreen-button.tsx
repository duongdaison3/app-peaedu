'use client'

import { Maximize2, Minimize2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface FullscreenButtonProps {
  containerRef: React.RefObject<HTMLDivElement>
}

export function FullscreenButton({ containerRef }: FullscreenButtonProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleToggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen()
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        }
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err)
    }
  }

  return (
    <button
      onClick={handleToggleFullscreen}
      title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
      className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
    >
      {isFullscreen ? (
        <Minimize2 size={20} />
      ) : (
        <Maximize2 size={20} />
      )}
    </button>
  )
}
