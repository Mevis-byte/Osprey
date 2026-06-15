import neo4j, { Driver, Session, QueryResult, ManagedTransaction } from 'neo4j-driver'
import { DEFAULT_GRAPH_CONFIG, type GraphConfig } from './config'
import type { GraphQueryResult } from './types'

export class GraphService {
  private driver: Driver | null = null
  private config: GraphConfig
  private _connected = false

  constructor(config?: Partial<GraphConfig>) {
    this.config = { ...DEFAULT_GRAPH_CONFIG, ...config }
  }

  get connected(): boolean {
    return this._connected
  }

  async connect(): Promise<void> {
    if (this.driver) return

    this.driver = neo4j.driver(
      this.config.uri,
      neo4j.auth.basic(this.config.user, this.config.password),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000,
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: this.config.connectionAcquisitionTimeoutMs,
      },
    )

    await this.driver.verifyConnectivity()
    this._connected = true
  }

  async disconnect(): Promise<void> {
    if (!this.driver) return
    await this.driver.close()
    this.driver = null
    this._connected = false
  }

  async verify(): Promise<boolean> {
    try {
      if (!this.driver) return false
      await this.driver.verifyConnectivity()
      return true
    } catch {
      return false
    }
  }

  session(): Session {
    if (!this.driver) throw new Error('GraphService not connected')
    return this.driver.session({ database: this.config.database })
  }

  async run<T = Record<string, unknown>>(
    cypher: string,
    params: Record<string, unknown> = {},
  ): Promise<GraphQueryResult<T>> {
    const session = this.session()
    const start = performance.now()
    try {
      const result: QueryResult = await session.run(cypher, params)
      const elapsed = performance.now() - start
      return {
        records: result.records.map((r) => r.toObject() as T),
        summary: { query: cypher, params, elapsed },
      }
    } finally {
      await session.close()
    }
  }

  async readTransaction<T>(
    fn: (tx: ManagedTransaction) => Promise<T>,
  ): Promise<T> {
    const session = this.session()
    try {
      return await session.executeRead(fn)
    } finally {
      await session.close()
    }
  }

  async writeTransaction<T>(
    fn: (tx: ManagedTransaction) => Promise<T>,
  ): Promise<T> {
    const session = this.session()
    try {
      return await session.executeWrite(fn)
    } finally {
      await session.close()
    }
  }

  // ─── Schema Management ──────────────────────────────────────────────────────

  async createConstraints(): Promise<void> {
    const constraints = [
      'CREATE CONSTRAINT IF NOT EXISTS FOR (a:Asset) REQUIRE a.id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (m:Mission) REQUIRE m.id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (a:Alert) REQUIRE a.id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (r:Region) REQUIRE r.id IS UNIQUE',
    ]
    for (const cypher of constraints) {
      await this.run(cypher)
    }
  }

  async createIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS FOR (a:Asset) ON (a.type)',
      'CREATE INDEX IF NOT EXISTS FOR (a:Asset) ON (a.status)',
      'CREATE INDEX IF NOT EXISTS FOR (m:Mission) ON (m.status)',
      'CREATE INDEX IF NOT EXISTS FOR (m:Mission) ON (m.region)',
      'CREATE INDEX IF NOT EXISTS FOR (a:Alert) ON (a.severity)',
      'CREATE INDEX IF NOT EXISTS FOR (a:Alert) ON (a.acknowledged)',
    ]
    for (const cypher of indexes) {
      await this.run(cypher)
    }
  }

  async clearDatabase(): Promise<void> {
    await this.run('MATCH (n) DETACH DELETE n')
  }
}

let instance: GraphService | null = null

export function getGraphService(config?: Partial<GraphConfig>): GraphService {
  if (!instance) {
    instance = new GraphService(config)
  }
  return instance
}

export function resetGraphService(): void {
  instance = null
}
