export interface TLEData {
  name: string;
  line1: string;
  line2: string;
}

export interface FetchGroupStatus {
  group: string;
  ok: boolean;
  status: number | null;
  error: string | null;
}

export class CelesTrakService {
  private static instance: CelesTrakService;
  private tleCache: Map<string, TLEData> = new Map();
  private lastFetchTime: number = 0;
  private readonly FETCH_INTERVAL = 24 * 60 * 60 * 1000;
  private fetchResults: FetchGroupStatus[] = [];

  private readonly GROUPS = {
    STATIONS: 'stations',
    STARLINK: 'starlink',
    GPS: 'gps-ops',
    GALILEO: 'galileo',
  };

  private readonly FALLBACK_TLES: Record<string, TLEData> = {
    '25544': {
      name: 'ISS (ZARYA)',
      line1: '1 25544U 98067A   24167.54483863  .00017103  00000+0  31105-3 0  9990',
      line2: '2 25544  51.6406 186.1362 0004505  44.1578  54.3418 15.49896707458421',
    },
  };

  private constructor() {
    for (const [id, tle] of Object.entries(this.FALLBACK_TLES)) {
      this.tleCache.set(id, tle);
    }
  }

  public static getInstance(): CelesTrakService {
    if (!CelesTrakService.instance) {
      CelesTrakService.instance = new CelesTrakService();
    }
    return CelesTrakService.instance;
  }

  public async fetchAll(): Promise<void> {
    const now = Date.now();
    if (now - this.lastFetchTime < this.FETCH_INTERVAL && this.tleCache.size > 1) {
      return;
    }

    const groups = Object.values(this.GROUPS);
    this.fetchResults = [];
    await Promise.all(groups.map(group => this.fetchGroup(group)));
    this.lastFetchTime = now;

    const failed = this.fetchResults.filter(r => !r.ok);
    if (failed.length > 0) {
      console.warn(
        `[CelesTrak] ${failed.length}/${groups.length} TLE groups failed to fetch:`,
        failed.map(r => `${r.group} (${r.status ?? 'error'})`).join(', '),
      );
    }
  }

  private async fetchGroup(group: string): Promise<void> {
    try {
      const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`;
      const response = await fetch(url);

      if (!response.ok) {
        this.fetchResults.push({
          group,
          ok: false,
          status: response.status,
          error: `HTTP ${response.status} ${response.statusText}`,
        });
        console.warn(`[CelesTrak] ${group}: HTTP ${response.status} — using fallback ephemeris`);
        return;
      }

      const text = await response.text();
      this.parseTLE(text);
      this.fetchResults.push({ group, ok: true, status: response.status, error: null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.fetchResults.push({ group, ok: false, status: null, error: msg });
      console.warn(`[CelesTrak] ${group}: network error — using fallback ephemeris`, msg);
    }
  }

  private parseTLE(text: string): void {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 >= lines.length) break;

      const name = lines[i];
      const line1 = lines[i + 1];
      const line2 = lines[i + 2];

      const noradId = line2.substring(2, 7).trim();
      this.tleCache.set(noradId, { name, line1, line2 });
    }
  }

  public getTLE(noradId: string): TLEData | undefined {
    return this.tleCache.get(noradId);
  }

  public getAllTLEs(): Map<string, TLEData> {
    return this.tleCache;
  }

  public getFetchResults(): readonly FetchGroupStatus[] {
    return this.fetchResults;
  }
}
