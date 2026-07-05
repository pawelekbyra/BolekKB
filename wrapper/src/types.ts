export interface BolekKnowledgeQuery {
  query: string
  topK?: number
  threshold?: number
  filters?: {
    collection?: string
    tags?: string[]
  }
}

export interface BolekSearchResult {
  content: string
  relevance: number
  metadata: {
    documentId?: string
    source?: string
    collection?: string
  }
}

export interface BolekQueryResponse {
  results: BolekSearchResult[]
  totalResults: number
  executionTime: number
}

export interface BolekStoreRequest {
  content: string
  metadata?: {
    source?: string
    collection?: string
    tags?: string[]
  }
}

export interface BolekStoreResponse {
  documentId: string
  indexed: boolean
  message: string
}

export interface BolekCollection {
  name: string
  count: number
  description?: string
}

export interface AnythingLLMDocument {
  id: string
  title: string
  content: string
  pageContent: string
  metadata: Record<string, any>
  score?: number
}
