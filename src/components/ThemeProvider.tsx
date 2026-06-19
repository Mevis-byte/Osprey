import { useEffect } from 'react'
import { useAppStore } from '@/store'
import { applyTheme } from '@/globe/layers/theme-colors'
import type { ThemeId } from '@/globe/layers/theme-colors'

interface HslTheme {
  accent: string
  ring: string
  mutedForeground: string
  border: string
}

const HSL_THEMES: Record<ThemeId, HslTheme> = {
  'tactical-blue': {
    accent: '195 100% 50%',
    ring: '195 100% 50%',
    mutedForeground: '215 20.2% 65.1%',
    border: '195 30% 20%',
  },
  'black-gold': {
    accent: '43 64% 52%',
    ring: '43 64% 52%',
    mutedForeground: '43 20% 65%',
    border: '43 30% 20%',
  },
  'military-green': {
    accent: '150 100% 50%',
    ring: '150 100% 50%',
    mutedForeground: '150 20% 65%',
    border: '150 30% 20%',
  },
  'monochrome': {
    accent: '0 0% 30%',
    ring: '0 0% 50%',
    mutedForeground: '0 0% 60%',
    border: '0 0% 18%',
  },
}

const THEME_CSS: Record<string, Record<string, string>> = {
  'tactical-blue': { '--theme-primary': '#00BFFF', '--theme-accent': '#4CC9FF', '--theme-success': '#00FF88', '--theme-warning': '#FFB800', '--theme-danger': '#FF5555' },
  'black-gold': { '--theme-primary': '#D4AF37', '--theme-accent': '#FFD700', '--theme-success': '#B6FF6A', '--theme-warning': '#FFC857', '--theme-danger': '#FF6B6B' },
  'military-green': { '--theme-primary': '#00FF88', '--theme-accent': '#7CFC00', '--theme-success': '#00FF88', '--theme-warning': '#FFD166', '--theme-danger': '#FF595E' },
  'monochrome': { '--theme-primary': '#FFFFFF', '--theme-accent': '#BBBBBB', '--theme-success': '#FFFFFF', '--theme-warning': '#CCCCCC', '--theme-danger': '#888888' },
}

function setCSSVariables(themeId: ThemeId): void {
  const vars = THEME_CSS[themeId]
  if (!vars) return
  const root = document.documentElement
  for (const [key, val] of Object.entries(vars)) {
    root.style.setProperty(key, val)
  }
  const hsl = HSL_THEMES[themeId]
  if (hsl) {
    root.style.setProperty('--accent', hsl.accent)
    root.style.setProperty('--ring', hsl.ring)
    root.style.setProperty('--muted-foreground', hsl.mutedForeground)
    root.style.setProperty('--border', hsl.border)
  }
  root.className = root.className.replace(/theme-\w+/g, '').trim()
  root.classList.add(`theme-${themeId}`)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.theme)

  useEffect(() => {
    applyTheme(theme)
    setCSSVariables(theme)
  }, [theme])

  return <>{children}</>
}

export type { ThemeId }
