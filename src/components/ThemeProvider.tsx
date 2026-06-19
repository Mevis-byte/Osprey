import { useEffect } from 'react'
import { useAppStore } from '@/store'
import { applyTheme } from '@/globe/layers/theme-colors'
import type { ThemeId } from '@/globe/layers/theme-colors'

interface FullHslTheme {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
}

const HSL_THEMES: Record<ThemeId, FullHslTheme> = {
  'tactical-blue': {
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    card: '222.2 84% 4.9%',
    cardForeground: '210 40% 98%',
    popover: '222.2 84% 4.9%',
    popoverForeground: '210 40% 98%',
    primary: '210 40% 98%',
    primaryForeground: '222.2 47.4% 11.2%',
    secondary: '217.2 32.6% 17.5%',
    secondaryForeground: '210 40% 98%',
    muted: '217.2 32.6% 17.5%',
    mutedForeground: '215 20.2% 65.1%',
    accent: '195 100% 50%',
    accentForeground: '210 40% 98%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '210 40% 98%',
    border: '217.2 32.6% 15%',
    input: '217.2 32.6% 17.5%',
    ring: '195 100% 50%',
  },
  'black-gold': {
    background: '0 0% 0%',
    foreground: '0 0% 100%',
    card: '0 0% 2%',
    cardForeground: '0 0% 100%',
    popover: '0 0% 2%',
    popoverForeground: '0 0% 100%',
    primary: '43 64% 52%',
    primaryForeground: '0 0% 100%',
    secondary: '43 30% 10%',
    secondaryForeground: '43 64% 52%',
    muted: '0 0% 5%',
    mutedForeground: '0 0% 69%',
    accent: '43 64% 52%',
    accentForeground: '0 0% 100%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '0 0% 100%',
    border: '0 0% 10%',
    input: '0 0% 10%',
    ring: '43 64% 52%',
  },
  'military-green': {
    background: '150 80% 3%',
    foreground: '150 30% 95%',
    card: '150 80% 3%',
    cardForeground: '150 30% 95%',
    popover: '150 80% 3%',
    popoverForeground: '150 30% 95%',
    primary: '150 100% 50%',
    primaryForeground: '150 80% 5%',
    secondary: '150 40% 12%',
    secondaryForeground: '150 100% 50%',
    muted: '150 40% 12%',
    mutedForeground: '150 20% 60%',
    accent: '150 100% 50%',
    accentForeground: '150 80% 5%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '150 30% 95%',
    border: '150 30% 14%',
    input: '150 30% 14%',
    ring: '150 100% 50%',
  },
  'monochrome': {
    background: '0 0% 3%',
    foreground: '0 0% 90%',
    card: '0 0% 3%',
    cardForeground: '0 0% 90%',
    popover: '0 0% 3%',
    popoverForeground: '0 0% 90%',
    primary: '0 0% 100%',
    primaryForeground: '0 0% 5%',
    secondary: '0 0% 15%',
    secondaryForeground: '0 0% 90%',
    muted: '0 0% 15%',
    mutedForeground: '0 0% 60%',
    accent: '0 0% 80%',
    accentForeground: '0 0% 10%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '0 0% 90%',
    border: '0 0% 15%',
    input: '0 0% 15%',
    ring: '0 0% 50%',
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

  // Set hex theme custom properties
  for (const [key, val] of Object.entries(vars)) {
    root.style.setProperty(key, val)
  }

  // Set ALL Tailwind HSL variables from the full palette
  const hsl = HSL_THEMES[themeId]
  if (hsl) {
    root.style.setProperty('--background', hsl.background)
    root.style.setProperty('--foreground', hsl.foreground)
    root.style.setProperty('--card', hsl.card)
    root.style.setProperty('--card-foreground', hsl.cardForeground)
    root.style.setProperty('--popover', hsl.popover)
    root.style.setProperty('--popover-foreground', hsl.popoverForeground)
    root.style.setProperty('--primary', hsl.primary)
    root.style.setProperty('--primary-foreground', hsl.primaryForeground)
    root.style.setProperty('--secondary', hsl.secondary)
    root.style.setProperty('--secondary-foreground', hsl.secondaryForeground)
    root.style.setProperty('--muted', hsl.muted)
    root.style.setProperty('--muted-foreground', hsl.mutedForeground)
    root.style.setProperty('--accent', hsl.accent)
    root.style.setProperty('--accent-foreground', hsl.accentForeground)
    root.style.setProperty('--destructive', hsl.destructive)
    root.style.setProperty('--destructive-foreground', hsl.destructiveForeground)
    root.style.setProperty('--border', hsl.border)
    root.style.setProperty('--input', hsl.input)
    root.style.setProperty('--ring', hsl.ring)
  }

  // Add theme class for CSS cascade overrides
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
