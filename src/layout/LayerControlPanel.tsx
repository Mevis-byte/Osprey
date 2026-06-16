import { useAppStore } from '@/store'
import type { LayerVisibility } from '@/store/app-store'
import { 
  Satellite, 
  Plane, 
  Ship, 
  Radio, 
  Circle, 
  Cone, 
  Share2, 
  Grid3X3, 
  SunMoon, 
  CloudSun,
  Map as MapIcon,
  Route
} from 'lucide-react'

const LAYER_CONFIG: { key: keyof LayerVisibility; label: string; icon: any }[] = [
  { key: 'satellites', label: 'Satellites', icon: Satellite },
  { key: 'aircraft', label: 'Aircraft', icon: Plane },
  { key: 'maritime', label: 'Maritime', icon: Ship },
  { key: 'groundStations', label: 'Ground Stations', icon: Radio },
  { key: 'coverageRings', label: 'Coverage Rings', icon: Circle },
  { key: 'sensorCones', label: 'Sensor Cones', icon: Cone },
  { key: 'commLinks', label: 'Comm Links', icon: Share2 },
  { key: 'trails', label: 'Asset Trails', icon: Route },
  { key: 'tacticalGrid', label: 'Tactical Grid', icon: Grid3X3 },
  { key: 'regions', label: 'Region Overlays', icon: MapIcon },
  { key: 'dayNight', label: 'Day/Night', icon: SunMoon },
  { key: 'weather', label: 'Weather', icon: CloudSun },
]

export function LayerControlPanel() {
  const layerVisibility = useAppStore((s) => s.layerVisibility)
  const toggleLayer = useAppStore((s) => s.toggleLayer)

  return (
    <div className="flex flex-col gap-1 p-3">
      <div className="mb-2 px-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
        Globe Layers
      </div>
      
      {LAYER_CONFIG.map(({ key, label, icon: Icon }) => {
        const isActive = layerVisibility[key]
        return (
          <button
            key={key}
            onClick={() => toggleLayer(key)}
            className={`flex items-center justify-between rounded-sm px-2.5 py-2 transition-all ${
              isActive 
                ? 'bg-white/5 text-foreground/90' 
                : 'text-muted-foreground/50 hover:bg-white/5 hover:text-muted-foreground/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-cyan-400' : 'text-muted-foreground/30'}`} />
              <span className="text-[11px] font-medium tracking-tight">{label}</span>
            </div>
            
            <div className={`h-1.5 w-1.5 rounded-full transition-all ${
              isActive ? 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-white/10'
            }`} />
          </button>
        )
      })}

      <div className="mt-4 border-t border-white/5 pt-4">
        <div className="px-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">
          Global Settings
        </div>
        <button 
          className="w-full rounded-sm border border-white/5 bg-white/5 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 transition-colors hover:bg-white/10 hover:text-muted-foreground/80"
          onClick={() => useAppStore.getState().resetFilters()}
        >
          Reset All Filters
        </button>
      </div>
    </div>
  )
}
