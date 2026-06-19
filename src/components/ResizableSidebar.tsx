import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store'

const COMPACT_WIDTH = 44

function safeWidth(w: number, min: number, max: number): number {
  return Number.isFinite(w) ? Math.max(min, Math.min(max, Math.round(w))) : min
}

interface ResizableSidebarProps {
  side: 'left' | 'right'
  defaultWidth: number
  minWidth?: number
  maxWidth?: number
  children: React.ReactNode
  compactContent?: React.ReactNode
  className?: string
}

export function ResizableSidebar({
  side,
  minWidth = 280,
  maxWidth = 700,
  children,
  compactContent,
  className = '',
}: ResizableSidebarProps) {
  const storeKey = side === 'left' ? 'sidebarLeft' : 'sidebarRight'
  const storeState = useAppStore((s) => s[storeKey])
  const setWidth = useAppStore(
    side === 'left' ? (s) => s.setSidebarLeftWidth : (s) => s.setSidebarRightWidth,
  )
  const setMode = useAppStore(
    side === 'left' ? (s) => s.setSidebarLeftMode : (s) => s.setSidebarRightMode,
  )

  const [isResizing, setIsResizing] = useState(false)
  const [dragWidth, setDragWidth] = useState(() => safeWidth(storeState.width, minWidth, maxWidth))
  const containerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)
  const dragWidthRef = useRef(dragWidth)
  const rafRef = useRef<number | null>(null)

  // Re-sync drag width when store width changes externally
  useEffect(() => {
    if (!isResizing) {
      const safe = safeWidth(storeState.width, minWidth, maxWidth)
      setDragWidth(safe)
      dragWidthRef.current = safe
    }
  }, [storeState.width, isResizing, minWidth, maxWidth])

  const currentWidth = isResizing
    ? dragWidth
    : storeState.mode === 'expanded'
      ? safeWidth(storeState.width, minWidth, maxWidth)
      : storeState.mode === 'compact'
        ? COMPACT_WIDTH
        : 0

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const startW = safeWidth(storeState.width, minWidth, maxWidth)
      startXRef.current = e.clientX
      startWidthRef.current = startW
      dragWidthRef.current = startW
      setDragWidth(startW)
      setIsResizing(true)
    },
    [storeState.width, minWidth, maxWidth],
  )

  const applyWidth = useCallback(
    (clientX: number) => {
      const delta = side === 'right' ? startXRef.current - clientX : clientX - startXRef.current
      const raw = startWidthRef.current + delta
      const clamped = safeWidth(raw, minWidth, maxWidth)
      dragWidthRef.current = clamped
      setDragWidth(clamped)
    },
    [side, minWidth, maxWidth],
  )

  const commitWidth = useCallback(() => {
    const final = safeWidth(dragWidthRef.current, minWidth, maxWidth)
    setWidth(final)
    dragWidthRef.current = final
    setDragWidth(final)
  }, [setWidth, minWidth, maxWidth])

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        applyWidth(e.clientX)
      })
    },
    [applyWidth],
  )

  const handlePointerUp = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    // Flush final position
    applyWidth(startXRef.current + (startXRef.current - startXRef.current))
    commitWidth()
    setIsResizing(false)
  }, [applyWidth, commitWidth])

  useEffect(() => {
    if (!isResizing) return
    const onMove = (e: PointerEvent) => handlePointerMove(e)
    const onUp = () => handlePointerUp()

    globalThis.addEventListener('pointermove', onMove, { passive: true })
    globalThis.addEventListener('pointerup', onUp)

    return () => {
      globalThis.removeEventListener('pointermove', onMove)
      globalThis.removeEventListener('pointerup', onUp)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isResizing, handlePointerMove, handlePointerUp])

  const handleDoubleClick = useCallback(() => {
    const next = storeState.mode === 'expanded' ? 'compact' : 'expanded'
    setMode(next)
  }, [storeState.mode, setMode])

  const isHidden = storeState.mode === 'hidden'
  const isCompact = storeState.mode === 'compact'

  const indicatorStyle = {
    backgroundColor: 'var(--theme-primary, #00BFFF)',
    boxShadow: `0 0 8px var(--theme-primary, #00BFFF)`,
  }

  return (
    <>
      {isResizing && (
        <div
          className="fixed inset-0 z-50 cursor-col-resize"
          style={{ touchAction: 'none' }}
        />
      )}
      {isResizing && (
        <div
          className="fixed top-0 bottom-0 z-40 w-px pointer-events-none"
          style={{
            ...indicatorStyle,
            [side]: `${currentWidth}px`,
          }}
        />
      )}
      <motion.div
        ref={containerRef}
        animate={{
          width: isHidden ? 0 : currentWidth,
          minWidth: isHidden ? 0 : currentWidth,
          opacity: isHidden ? 0 : 1,
        }}
        transition={{ duration: isResizing ? 0 : 0.2, ease: 'easeInOut' }}
        className={`relative flex min-h-0 flex-col overflow-hidden ${className}`}
      >
        {!isHidden && (
          <>
            <div
              className={`absolute inset-y-0 z-30 w-1 cursor-col-resize touch-none transition-colors ${
                side === 'left' ? 'right-0' : 'left-0'
              }`}
              style={{
                backgroundColor: isResizing ? 'var(--theme-primary)' : 'transparent',
                opacity: isResizing ? 0.4 : 0,
              }}
              onPointerDown={handlePointerDown}
              onDoubleClick={handleDoubleClick}
            />

            <div className="flex min-h-0 flex-1 flex-col">
              {isCompact && compactContent ? (
                compactContent
              ) : (
                <div className={`flex min-h-0 flex-1 ${isResizing ? 'pointer-events-none' : ''}`}>
                  {children}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </>
  )
}
