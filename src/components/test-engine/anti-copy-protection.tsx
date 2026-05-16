'use client'

import { useEffect } from 'react'

interface AntiCopyProtectionProps {
  maxViolations?: number
  onViolation?: (reason: string, count: number) => void
  onMaxViolations?: (count: number) => void
  attemptId?: string | null
}

export function AntiCopyProtection({
  maxViolations = 3,
  onViolation,
  onMaxViolations
  , attemptId = null
}: AntiCopyProtectionProps) {
  useEffect(() => {
    let violationCount = 0

    const registerViolation = (reason: string) => {
      violationCount += 1
      onViolation?.(reason, violationCount)
      // send server-side log (best-effort, do not await)
      try {
        void fetch('/api/anti-cheat/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attemptId, reason, count: violationCount, meta: { userAgent: navigator.userAgent } })
        })
      } catch (e) {
        // ignore
      }
      if (violationCount >= maxViolations) {
        onMaxViolations?.(violationCount)
      }
    }

    // Prevent text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault()
      registerViolation('select-start')
      return false
    }

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      registerViolation('context-menu')
      return false
    }

    // Prevent copy
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      registerViolation('copy')
      return false
    }

    // Prevent cut
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault()
      registerViolation('cut')
      return false
    }

    // Detect developer tools
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C')
      ) {
        e.preventDefault()
        registerViolation('devtools-shortcut')
        return false
      }
    }

    // Detect tab visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerViolation('tab-hidden')
      }
    }

    const handleWindowBlur = () => {
      registerViolation('window-blur')
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        registerViolation('fullscreen-exit')
      }
    }

    document.addEventListener('selectstart', handleSelectStart, false)
    document.addEventListener('contextmenu', handleContextMenu, false)
    document.addEventListener('copy', handleCopy, false)
    document.addEventListener('cut', handleCut, false)
    document.addEventListener('keydown', handleKeyDown, false)
    document.addEventListener('visibilitychange', handleVisibilityChange, false)
    window.addEventListener('blur', handleWindowBlur)
    document.addEventListener('fullscreenchange', handleFullscreenChange, false)

    return () => {
      document.removeEventListener('selectstart', handleSelectStart, false)
      document.removeEventListener('contextmenu', handleContextMenu, false)
      document.removeEventListener('copy', handleCopy, false)
      document.removeEventListener('cut', handleCut, false)
      document.removeEventListener('keydown', handleKeyDown, false)
      document.removeEventListener('visibilitychange', handleVisibilityChange, false)
      window.removeEventListener('blur', handleWindowBlur)
      document.removeEventListener('fullscreenchange', handleFullscreenChange, false)
    }
  }, [maxViolations, onMaxViolations, onViolation])

  return null
}
