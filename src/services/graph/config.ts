export interface GraphConfig {
  uri: string
  user: string
  password: string
  database?: string
  syncIntervalMs: number
  connectionAcquisitionTimeoutMs: number
}

function env(key: string, fallback: string): string {
  return (import.meta as Record<string, any>).env?.[key] ?? fallback
}

export const DEFAULT_GRAPH_CONFIG: GraphConfig = {
  uri: env('VITE_NEO4J_URI', 'bolt://localhost:7687'),
  user: env('VITE_NEO4J_USER', 'neo4j'),
  password: env('VITE_NEO4J_PASSWORD', 'password'),
  database: env('VITE_NEO4J_DATABASE', 'neo4j'),
  syncIntervalMs: 5000,
  connectionAcquisitionTimeoutMs: 10000,
}
