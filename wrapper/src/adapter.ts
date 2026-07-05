import type {
  BolekKnowledgeQuery,
  BolekQueryResponse,
  BolekSearchResult,
  BolekStoreRequest,
  BolekStoreResponse,
  BolekCollection,
  AnythingLLMDocument
} from './types'
import { Logger } from './logger'

export class AnythingLLMAdapter {
  constructor(private baseUrl: string, private logger: Logger) {}

  async queryKnowledge(request: BolekKnowledgeQuery): Promise<BolekQueryResponse> {
    try {
      this.logger.info('Querying knowledge base', {
        query: request.query.substring(0, 50),
        topK: request.topK
      })

      const queryParams = new URLSearchParams({
        query: request.query,
        ...(request.topK && { topK: request.topK.toString() }),
        ...(request.threshold && { threshold: request.threshold.toString() })
      })

      const collectionFilter = request.filters?.collection
        ? `?collection=${encodeURIComponent(request.filters.collection)}`
        : ''

      const response = await fetch(
        `${this.baseUrl}/api/v1/workspace/query${collectionFilter}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: request.query })
        }
      )

      if (!response.ok) {
        throw new Error(`AnythingLLM API error: ${response.status}`)
      }

      const data = await response.json()
      const startTime = Date.now()

      const results: BolekSearchResult[] = (data.documents || []).map(
        (doc: AnythingLLMDocument) => ({
          content: doc.pageContent || doc.content || '',
          relevance: doc.score || 0,
          metadata: {
            documentId: doc.id,
            source: doc.metadata?.source,
            collection: doc.metadata?.collection
          }
        })
      )

      const executionTime = Date.now() - startTime

      return {
        results,
        totalResults: results.length,
        executionTime
      }
    } catch (error) {
      this.logger.error('Knowledge query failed', { error: String(error) })
      throw error
    }
  }

  async storeDocument(request: BolekStoreRequest): Promise<BolekStoreResponse> {
    try {
      this.logger.info('Storing document', {
        contentLength: request.content.length,
        collection: request.metadata?.collection
      })

      const response = await fetch(`${this.baseUrl}/api/v1/workspace/document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: request.content,
          metadata: request.metadata || {},
          tags: request.metadata?.tags || []
        })
      })

      if (!response.ok) {
        throw new Error(`AnythingLLM API error: ${response.status}`)
      }

      const data = await response.json()

      return {
        documentId: data.documentId || data.id || `doc-${Date.now()}`,
        indexed: data.indexed !== false,
        message: data.message || 'Document stored successfully'
      }
    } catch (error) {
      this.logger.error('Store document failed', { error: String(error) })
      throw error
    }
  }

  async listCollections(): Promise<BolekCollection[]> {
    try {
      this.logger.info('Listing collections')

      const response = await fetch(`${this.baseUrl}/api/v1/workspace/collections`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`AnythingLLM API error: ${response.status}`)
      }

      const data = await response.json()

      return (data.collections || []).map((collection: any) => ({
        name: collection.name,
        count: collection.documentCount || 0,
        description: collection.description
      }))
    } catch (error) {
      this.logger.error('List collections failed', { error: String(error) })
      throw error
    }
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      this.logger.info('Deleting document', { documentId })

      const response = await fetch(
        `${this.baseUrl}/api/v1/workspace/document/${encodeURIComponent(documentId)}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }
      )

      if (!response.ok) {
        throw new Error(`AnythingLLM API error: ${response.status}`)
      }

      return true
    } catch (error) {
      this.logger.error('Delete document failed', { error: String(error) })
      throw error
    }
  }

  async deleteCollection(collectionName: string): Promise<boolean> {
    try {
      this.logger.info('Deleting collection', { collectionName })

      const response = await fetch(
        `${this.baseUrl}/api/v1/workspace/collection/${encodeURIComponent(collectionName)}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }
      )

      if (!response.ok) {
        throw new Error(`AnythingLLM API error: ${response.status}`)
      }

      return true
    } catch (error) {
      this.logger.error('Delete collection failed', { error: String(error) })
      throw error
    }
  }
}
