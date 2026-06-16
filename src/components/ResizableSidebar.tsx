import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store'

interface ResizableSidebarProps {
  side: 'left' | 'right'
  defaultWidth: number
  minWidth?: number
  maxWidth?: number
  children: React.ReactNode
  compactContent?: React.ReactNode
  className?: string
}

const COMPACT_WIDTH = 44

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
  const [dragWidth, setDragWidth] = useState(storeState.width)
  const containerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(storeState.width)
  const rafRef = useRef<number | null>(null)

  const currentWidth = isResizing
    ? dragWidth
    : storeState.mode === 'expanded'
      ? storeState.width
      : storeState.mode === 'compact'
        ? COMPACT_WIDTH
        : 0

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      startXRef.current = e.clientX
      startWidthRef.current = storeState.width
      setDragWidth(storeState.width)
    },
    [storeState.width],
  )

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        const delta = side === 'right' ? startXRef.current - e.clientX : e.clientX - startXRef.current
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + delta))
        setDragWidth(newWidth)
      })
    },
    [side, minWidth, maxWidth],
  )

  const handlePointerUp = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setIsResizing(false)
    setWidth(dragWidth)

    globalThis.dispatchEvent(new CustomEvent('sidebar-resize'))
  }, [dragWidth, setWidth])

  useEffect(() => {
    if (!isResizing) return
    const el = containerRef.current
    if (!el) return
    el.setPointerCapture(0)

    const onMove = (e: PointerEvent) => handlePointerMove(e)
    const onUp = () => handlePointerUp()

    globalThis.addEventListener('pointermove', onMove)
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
    setMode(storeState.mode === 'expanded' ? 'compact' : 'expanded')
  }, [storeState.mode, setMode])

  const isHidden = storeState.mode === 'hidden'
  const isCompact = storeState.mode === 'compact'

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
          className="fixed top-0 bottom-0 z-40 w-px bg-cyan-500/60 shadow-[0_0_8px_rgba(34,211,238,0.3)] pointer-events-none"
          style={{
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
              className={`absolute inset-y-0 z-30 w-1 cursor-col-resize touch-none transition-colors hover:bg-cyan-500/30 ${
                isResizing ? 'bg-cyan-500/40' : ''
              } ${
                side === 'left' ? 'right-0' : 'left-0'
              }`}
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
