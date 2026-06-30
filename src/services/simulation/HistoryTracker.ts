import type { HistoryPoint } from './types'
export class HistoryTracker {
  private points: HistoryPoint[] = []
  private elapsed = 0

  constructor(
    private readonly maxPoints = 500,
    private readonly recordInterval = 0.5,
  ) {}

  update(rawDt: number, latitude: number, longitude: number, altitude: number): void {
    this.elapsed += rawDt
    if (this.elapsed < this.recordInterval) return
    this.elapsed = 0

    this.points.push({
      latitude,
      longitude,
      altitude,
      timestamp: Date.now(),
    })

    if (this.points.length > this.maxPoints) {
      this.points.shift()
    }
  }

  getPoints(): readonly HistoryPoint[] {
    return this.points
  }

  clear(): void {
    this.points = []
  }
}
