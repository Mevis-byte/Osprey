import TopBar from '@/layout/TopBar'
import LeftPanel from '@/layout/LeftPanel'
import RightPanel from '@/layout/RightPanel'
import TimelinePanel from '@/layout/TimelinePanel'
import GlobeViewer from '@/globe/GlobeViewer'

function App() {
  return (
    <div className="grid h-screen w-screen grid-rows-[32px_1fr_32px] overflow-hidden bg-background">
      <TopBar />

      <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[280px_1fr_320px]">
        <div className="hidden min-h-0 lg:flex lg:flex-col">
          <LeftPanel />
        </div>

        <main className="relative min-h-0">
          <GlobeViewer />
        </main>

        <div className="hidden min-h-0 lg:flex lg:flex-col">
          <RightPanel />
        </div>
      </div>

      <TimelinePanel />
    </div>
  )
}

export default App
