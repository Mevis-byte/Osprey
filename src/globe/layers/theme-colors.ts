import * as Cesium from 'cesium'

export type ThemeId = 'tactical-blue' | 'black-gold' | 'military-green' | 'monochrome'

export interface ThemeTokens {
  background: string
  primary: string
  accent: string
  secondary?: string
  success: string
  warning: string
  danger: string
}

export const THEMES: Record<ThemeId, ThemeTokens> = {
  'tactical-blue': {
    background: '#000000',
    primary: '#00BFFF',
    accent: '#4CC9FF',
    success: '#00FF88',
    warning: '#FFB800',
    danger: '#FF5555',
  },
  'black-gold': {
    background: '#000000',
    primary: '#D4AF37',
    accent: '#FFD700',
    secondary: '#B8860B',
    success: '#B6FF6A',
    warning: '#FFC857',
    danger: '#FF6B6B',
  },
  'military-green': {
    background: '#050505',
    primary: '#00FF88',
    accent: '#7CFC00',
    success: '#00FF88',
    warning: '#FFD166',
    danger: '#FF595E',
  },
  'monochrome': {
    background: '#000000',
    primary: '#FFFFFF',
    accent: '#BBBBBB',
    success: '#FFFFFF',
    warning: '#CCCCCC',
    danger: '#888888',
  },
}

export const THEME_LABELS: Record<ThemeId, string> = {
  'tactical-blue': 'Tactical Blue',
  'black-gold': 'Black & Gold',
  'military-green': 'Military Green',
  'monochrome': 'Monochrome',
}

export const THEME_ICONS: Record<ThemeId, string> = {
  'tactical-blue': '\uD83C\uDFAF',
  'black-gold': '\uD83D\uDC51',
  'military-green': '\uD83D\uDFE2',
  'monochrome': '\u26AA',
}

const _parsed = new Cesium.Color()

function setColorFromString(target: Cesium.Color, css: string, alpha?: number): void {
  Cesium.Color.fromCssColorString(css, _parsed)
  target.red = _parsed.red
  target.green = _parsed.green
  target.blue = _parsed.blue
  target.alpha = alpha ?? _parsed.alpha
}

function buildColor(css: string, alpha = 1): Cesium.Color {
  const c = new Cesium.Color()
  Cesium.Color.fromCssColorString(css, c)
  c.alpha = alpha
  return c
}

export const ThemeColor = {
  primary: buildColor('#00BFFF'),
  accent: buildColor('#4CC9FF'),
  success: buildColor('#00FF88'),
  warning: buildColor('#FFB800'),
  danger: buildColor('#FF5555'),

  primary08: buildColor('#00BFFF', 0.8),
  primary055: buildColor('#00BFFF', 0.55),
  accent055: buildColor('#4CC9FF', 0.55),

  trailAircraft: buildColor('#00BFFF', 0.40),
  trailMaritime: buildColor('#00FF88', 0.40),
  trailSatellite: buildColor('#4CC9FF', 0.40),
  futureAircraft: buildColor('#00BFFF', 0.18),
  futureMaritime: buildColor('#00FF88', 0.18),
  futureSatellite: buildColor('#4CC9FF', 0.18),

  orbitPast: buildColor('#00BFFF', 0.2),
  orbitFuture: buildColor('#00BFFF', 0.7),
  orbitHint: buildColor('#00FF88', 0.15),
  orbitPosition: buildColor('#00BFFF', 1),
  orbitPastMid: buildColor('#FFB800', 0.2),
  orbitFutureMid: buildColor('#FFB800', 0.7),
  orbitHintMid: buildColor('#FFB800', 0.15),
  orbitPositionMid: buildColor('#FFB800', 1),
  orbitPastHigh: buildColor('#00BFFF', 0.2),
  orbitFutureHigh: buildColor('#00BFFF', 0.7),
  orbitHintHigh: buildColor('#00BFFF', 0.15),
  orbitPositionHigh: buildColor('#00BFFF', 1),

  sensorCone: buildColor('#00BFFF', 0.12),
  tacticalGrid: buildColor('#00FF88', 0.20),
}

function setOrbitColors(css: string): void {
  // Low orbit (alt < 2,000,000) → success
  setColorFromString(ThemeColor.orbitPast, css, 0.2)
  setColorFromString(ThemeColor.orbitFuture, css, 0.7)
  setColorFromString(ThemeColor.orbitHint, css, 0.15)
  setColorFromString(ThemeColor.orbitPosition, css, 1)
}

function setMidOrbitColors(css: string): void {
  // Mid orbit (2,000,000 < alt < 35,786,000) → warning
  setColorFromString(ThemeColor.orbitPastMid, css, 0.2)
  setColorFromString(ThemeColor.orbitFutureMid, css, 0.7)
  setColorFromString(ThemeColor.orbitHintMid, css, 0.15)
  setColorFromString(ThemeColor.orbitPositionMid, css, 1)
}

function setHighOrbitColors(css: string): void {
  // High orbit (alt >= 35,786,000) → accent
  setColorFromString(ThemeColor.orbitPastHigh, css, 0.2)
  setColorFromString(ThemeColor.orbitFutureHigh, css, 0.7)
  setColorFromString(ThemeColor.orbitHintHigh, css, 0.15)
  setColorFromString(ThemeColor.orbitPositionHigh, css, 1)
}

export function applyTheme(themeId: ThemeId): ThemeTokens {
  const tokens = THEMES[themeId]

  setColorFromString(ThemeColor.primary, tokens.primary)
  setColorFromString(ThemeColor.accent, tokens.accent)
  setColorFromString(ThemeColor.success, tokens.success)
  setColorFromString(ThemeColor.warning, tokens.warning)
  setColorFromString(ThemeColor.danger, tokens.danger)

  setColorFromString(ThemeColor.primary08, tokens.primary, 0.8)
  setColorFromString(ThemeColor.primary055, tokens.primary, 0.55)
  setColorFromString(ThemeColor.accent055, tokens.accent, 0.55)

  setColorFromString(ThemeColor.trailAircraft, tokens.primary, 0.40)
  setColorFromString(ThemeColor.trailMaritime, tokens.success, 0.40)
  setColorFromString(ThemeColor.trailSatellite, tokens.accent, 0.40)
  setColorFromString(ThemeColor.futureAircraft, tokens.primary, 0.18)
  setColorFromString(ThemeColor.futureMaritime, tokens.success, 0.18)
  setColorFromString(ThemeColor.futureSatellite, tokens.accent, 0.18)

  setOrbitColors(tokens.primary)
  setMidOrbitColors(tokens.warning)
  setHighOrbitColors(tokens.accent)

  setColorFromString(ThemeColor.sensorCone, tokens.primary, 0.12)
  setColorFromString(ThemeColor.tacticalGrid, tokens.primary, 0.20)

  return tokens
}
