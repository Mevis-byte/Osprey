import { useEffect, useRef } from 'react'
import { Search, Activity, Share2, Layers, Network, FileText, Plane, Ship, Satellite, Radio, Globe } from 'lucide-react'
import TopBar from '@/layout/TopBar'
import LeftPanel from '@/layout/LeftPanel'
import RightPanel from '@/layout/RightPanel'
import TimelinePanel from '@/layout/TimelinePanel'
import GlobalSearch from '@/layout/GlobalSearch'
import GlobeViewer from '@/globe/GlobeViewer'
import { ResizableSidebar } from '@/components/ResizableSidebar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useSimulation } from '@/hooks/useSimulation'
import { useAppStore } from '@/store'
import { ThemeProvider } from '@/components/ThemeProvider'

function CompactBar({
  icons,
  side,
}: {
  icons: { icon: any; label: string; onClick: () => void; isActive?: boolean }[]
  side: 'left' | 'right'
}) {
  const setMode = useAppStore(
    side === 'left' ? (s) => s.setSidebarLeftMode : (s) => s.setSidebarRightMode,
  )

  return (
    <div className="flex h-full flex-col items-center gap-2 border-r border-border bg-card py-2">
      {icons.map(({ icon: Icon, label, onClick, isActive }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          title={label}
          className={`flex items-center justify-center rounded-sm p-1.5 transition-colors ${
            isActive
              ? 'text-cyan-400 bg-cyan-500/10'
              : 'text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-accent/30'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => setMode('expanded')}
        title="Expand"
        className="mb-2 flex items-center justify-center rounded-sm p-1.5 text-muted-foreground/40 hover:text-muted-foreground/70 hover:bg-accent/30 transition-colors"
      >
        <ChevronIcon side={side} />
      </button>
    </div>
  )
}

function ChevronIcon({ side }: { side: 'left' | 'right' }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points={side === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  )
}

function App() {
  useSimulation()

  const mainRef = useRef<HTMLElement>(null)
  const resizeTimerRef = useRef<number | null>(null)

  const setLeftMode = useAppStore((s) => s.setSidebarLeftMode)
  const setRightMode = useAppStore((s) => s.setSidebarRightMode)
  const toggleLeft = useAppStore((s) => s.toggleSidebarLeft)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault()
        toggleLeft()
      }
    }
    globalThis.addEventListener('keydown', handler)
    return () => globalThis.removeEventListener('keydown', handler)
  }, [toggleLeft])

  // ResizeObserver — robust Cesium viewer resize on any layout change
  useEffect(() => {
    const el = mainRef.current
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      for (const _entry of entries) {
        if (resizeTimerRef.current !== null) {
          cancelAnimationFrame(resizeTimerRef.current)
        }
        resizeTimerRef.current = requestAnimationFrame(() => {
          resizeTimerRef.current = null
          const viewer = (globalThis as any).__cesiumViewer
          if (viewer && typeof viewer.resize === 'function') {
            viewer.resize()
          }
        })
      }
    })

    ro.observe(el)
    return () => {
      ro.disconnect()
      if (resizeTimerRef.current !== null) {
        cancelAnimationFrame(resizeTimerRef.current)
        resizeTimerRef.current = null
      }
    }
  }, [])

  return (
    <ThemeProvider>
      <GlobalSearch />
      <div className="grid h-screen w-screen grid-rows-[32px_1fr_32px] overflow-hidden bg-background">
        <TopBar />

        <div className="flex min-h-0">
          <ErrorBoundary>
            <ResizableSidebar
              side="left"
              defaultWidth={360}
              minWidth={280}
              maxWidth={600}
              compactContent={
                <CompactBar
                  side="left"
                  icons={[
                    { icon: Search, label: 'Stream', onClick: () => setLeftMode('expanded') },
                    { icon: Activity, label: 'Intel', onClick: () => setLeftMode('expanded') },
                    { icon: Share2, label: 'Graph', onClick: () => setLeftMode('expanded') },
                    { icon: Layers, label: 'Layers', onClick: () => setLeftMode('expanded') },
                    { icon: Network, label: 'Ontology', onClick: () => setLeftMode('expanded') },
                    { icon: FileText, label: 'Cases', onClick: () => setLeftMode('expanded') },
                  ]}
                />
              }
              className="hidden lg:flex"
            >
              <LeftPanel />
            </ResizableSidebar>
          </ErrorBoundary>

          <ErrorBoundary>
            <main ref={mainRef} className="relative flex-1 min-w-0 min-h-0">
              <GlobeViewer />
            </main>
          </ErrorBoundary>

          <ErrorBoundary>
            <ResizableSidebar
              side="right"
              defaultWidth={320}
              minWidth={280}
              maxWidth={700}
              compactContent={
                <CompactBar
                  side="right"
                  icons={[
                    { icon: Globe, label: 'Dashboard', onClick: () => setRightMode('expanded') },
                    { icon: Plane, label: 'Aircraft', onClick: () => setRightMode('expanded') },
                    { icon: Ship, label: 'Maritime', onClick: () => setRightMode('expanded') },
                    { icon: Satellite, label: 'Satellite', onClick: () => setRightMode('expanded') },
                    { icon: Radio, label: 'Signals', onClick: () => setRightMode('expanded') },
                  ]}
                />
              }
              className="hidden lg:flex"
            >
              <RightPanel />
            </ResizableSidebar>
          </ErrorBoundary>
        </div>

        <TimelinePanel />
      </div>
    </ThemeProvider>
  )
}

export default App
