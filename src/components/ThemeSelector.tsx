import { useAppStore } from '@/store'
import { THEME_LABELS, THEME_ICONS } from '@/globe/layers/theme-colors'
import type { ThemeId } from '@/globe/layers/theme-colors'

const THEME_IDS: ThemeId[] = ['tactical-blue', 'black-gold', 'military-green', 'monochrome']

export function ThemeSelector() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as ThemeId)}
      className="bg-transparent text-[10px] font-bold tracking-wider uppercase outline-none cursor-pointer hover:opacity-80 transition-opacity"
      style={{ color: 'var(--theme-primary, #00BFFF)' }}
    >
      {THEME_IDS.map((id) => (
        <option key={id} value={id} className="bg-[#0d1117] text-white">
          {THEME_ICONS[id]} {THEME_LABELS[id]}
        </option>
      ))}
    </select>
  )
}
