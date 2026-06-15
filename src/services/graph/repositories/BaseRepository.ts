import type { ManagedTransaction } from 'neo4j-driver'
import { GraphService, getGraphService } from '../GraphService'
import type { GraphQueryResult } from '../types'

export abstract class BaseRepository {
  protected graph: GraphService

  constructor(graph?: GraphService) {
    this.graph = graph ?? getGraphService()
  }

  protected async run<T = Record<string, unknown>>(
    cypher: string,
    params: Record<string, unknown> = {},
  ): Promise<GraphQueryResult<T>> {
    return this.graph.run<T>(cypher, params)
  }

  protected async executeRead<T>(fn: (tx: ManagedTransaction) => Promise<T>): Promise<T> {
    return this.graph.readTransaction(fn)
  }

  protected async executeWrite<T>(fn: (tx: ManagedTransaction) => Promise<T>): Promise<T> {
    return this.graph.writeTransaction(fn)
  }
}
