# BolekKB Wrapper — Implementation Setup

> Implementation guide for AnythingLLM wrapper. For Codex to follow.

---

## Task 1-4: Same as BolekCzat/BolekFlow

**Task 1:** Initialize `package.json`
**Task 2:** Create `tsconfig.json`
**Task 3:** Create `src/types.ts`
**Task 4:** Create `src/logger.ts`

**File:** `src/types.ts` for BolekKB:

```typescript
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
```

---

## Task 5: AnythingLLM Adapter

**File:** `src/adapter.ts`

```typescript
import { Logger } from './logger'
import type {
  BolekKnowledgeQuery,
  BolekQueryResponse,
  BolekStoreRequest,
  BolekStoreResponse,
  BolekCollection,
  BolekSearchResult,
  AnythingLLMDocument
} from './types'

export class AnythingLLMAdapter {
  private baseUrl: string
  private logger: Logger

  constructor(baseUrl: string, logger: Logger) {
    this.baseUrl = baseUrl
    this.logger = logger
  }

  async queryKnowledge(request: BolekKnowledgeQuery): Promise<BolekQueryResponse> {
    try {
      const startTime = Date.now()

      const response = await fetch(`${this.baseUrl}/api/v1/workspace/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: request.query,
          mode: 'query',
          // AnythingLLM specific fields
        })
      })

      if (!response.ok) {
        this.logger.error('AnythingLLM API error', { status: response.status })
        return {
          results: [],
          totalResults: 0,
          executionTime: Date.now() - startTime
        }
      }

      const data = await response.json()

      // Transform AnythingLLM response to Bolek format
      const results: BolekSearchResult[] = (data.documents || []).map((doc: AnythingLLMDocument) => ({
        content: doc.pageContent || doc.content || '',
        relevance: doc.score || 0.5,
        metadata: {
          documentId: doc.id,
          source: doc.metadata?.source,
          collection: doc.metadata?.collection
        }
      }))

      const executionTime = Date.now() - startTime

      this.logger.info('Knowledge query executed', {
        query: request.query.substring(0, 50),
        resultsCount: results.length,
        executionTime
      })

      return {
        results,
        totalResults: results.length,
        executionTime
      }
    } catch (err) {
      this.logger.error('Adapter error in queryKnowledge', { error: String(err) })
      return {
        results: [],
        totalResults: 0,
        executionTime: 0
      }
    }
  }

  async storeDocument(request: BolekStoreRequest): Promise<BolekStoreResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workspace/document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: request.content,
          metadata: request.metadata,
          // AnythingLLM specific fields
        })
      })

      if (!response.ok) {
        this.logger.error('AnythingLLM store error', { status: response.status })
        return {
          documentId: '',
          indexed: false,
          message: 'Failed to store document'
        }
      }

      const data = await response.json()

      this.logger.info('Document stored', {
        documentId: data.documentId,
        contentLength: request.content.length
      })

      return {
        documentId: data.documentId || `doc_${Date.now()}`,
        indexed: true,
        message: 'Document indexed successfully'
      }
    } catch (err) {
      this.logger.error('Adapter error in storeDocument', { error: String(err) })
      return {
        documentId: '',
        indexed: false,
        message: String(err)
      }
    }
  }

  async listCollections(): Promise<BolekCollection[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workspace/collections`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`AnythingLLM returned ${response.status}`)
      }

      const data = await response.json()

      const collections: BolekCollection[] = (data.collections || []).map((c: any) => ({
        name: c.name,
        count: c.documentCount || 0,
        description: c.description
      }))

      return collections
    } catch (err) {
      this.logger.error('Adapter error in listCollections', { error: String(err) })
      return []
    }
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workspace/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        this.logger.warn('Failed to delete document', { status: response.status })
        return false
      }

      this.logger.info('Document deleted', { documentId })
      return true
    } catch (err) {
      this.logger.error('Adapter error in deleteDocument', { error: String(err) })
      return false
    }
  }

  async deleteCollection(collectionName: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workspace/collections/${collectionName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        this.logger.warn('Failed to delete collection', { status: response.status })
        return 0
      }

      const data = await response.json()
      this.logger.info('Collection deleted', { collectionName, deletedCount: data.deletedCount })

      return data.deletedCount || 0
    } catch (err) {
      this.logger.error('Adapter error in deleteCollection', { error: String(err) })
      return 0
    }
  }
}
```

**Commit:**
```
feat: implement AnythingLLM adapter for knowledge operations
```

---

## Task 6: Wrapper Server

**File:** `src/index.ts`

```typescript
import { Hono } from 'hono'
import { AnythingLLMAdapter } from './adapter'
import { Logger } from './logger'
import type { BolekKnowledgeQuery, BolekStoreRequest } from './types'

const app = new Hono()
const logger = new Logger('info')

const ANYTHINGLLM_URL = process.env.ANYTHINGLLM_URL || 'http://anythingllm:3001'
const WRAPPER_PORT = parseInt(process.env.WRAPPER_PORT || '3002')
const AUTH_TOKEN = process.env.BOLEK_API_TOKEN || 'test_token'

const adapter = new AnythingLLMAdapter(ANYTHINGLLM_URL, logger)

// Auth middleware
app.use('*', async (c, next) => {
  const auth = c.req.header('Authorization')
  if (auth !== `Bearer ${AUTH_TOKEN}`) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})

// POST /api/agent/knowledge/query
app.post('/api/agent/knowledge/query', async (c) => {
  try {
    const body = await c.req.json<BolekKnowledgeQuery>()
    logger.info('Knowledge query', { query: body.query.substring(0, 50) })

    const result = await adapter.queryKnowledge(body)
    return c.json(result)
  } catch (err) {
    logger.error('POST /api/agent/knowledge/query failed', { error: String(err) })
    return c.json({ error: 'Failed to query knowledge' }, 500)
  }
})

// POST /api/agent/knowledge/store
app.post('/api/agent/knowledge/store', async (c) => {
  try {
    const body = await c.req.json<BolekStoreRequest>()
    logger.info('Storing document', { contentLength: body.content.length })

    const result = await adapter.storeDocument(body)
    return c.json(result)
  } catch (err) {
    logger.error('POST /api/agent/knowledge/store failed', { error: String(err) })
    return c.json({ error: 'Failed to store document' }, 500)
  }
})

// GET /api/agent/knowledge/collections
app.get('/api/agent/knowledge/collections', async (c) => {
  try {
    const collections = await adapter.listCollections()
    return c.json({ collections })
  } catch (err) {
    logger.error('GET /api/agent/knowledge/collections failed', { error: String(err) })
    return c.json({ error: 'Failed to list collections' }, 500)
  }
})

// DELETE /api/agent/knowledge/documents/:docId
app.delete('/api/agent/knowledge/documents/:docId', async (c) => {
  try {
    const docId = c.req.param('docId')
    const success = await adapter.deleteDocument(docId)
    return c.json({ success, deleted: docId })
  } catch (err) {
    logger.error('DELETE document failed', { error: String(err) })
    return c.json({ error: 'Failed to delete document' }, 500)
  }
})

// DELETE /api/agent/knowledge/collections/:name
app.delete('/api/agent/knowledge/collections/:name', async (c) => {
  try {
    const collectionName = c.req.param('name')
    const deletedCount = await adapter.deleteCollection(collectionName)
    return c.json({ success: deletedCount > 0, deletedCount })
  } catch (err) {
    logger.error('DELETE collection failed', { error: String(err) })
    return c.json({ error: 'Failed to delete collection' }, 500)
  }
})

// Health
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'bolek-kb-wrapper' })
})

logger.info('BolekKB wrapper starting', { port: WRAPPER_PORT, anythingllmUrl: ANYTHINGLLM_URL })

export default {
  fetch: app.fetch,
  port: WRAPPER_PORT
}
```

**Commit:**
```
feat: implement wrapper server with knowledge endpoints
```

---

## Task 7-10: Docker, Env, Tests, README

Same pattern as BolekCzat/BolekFlow:
- `docker-compose.yml` (wrapper + AnythingLLM on different ports)
- `.env.example` (configuration template)
- `src/__tests__/adapter.test.ts` (unit tests)
- `WRAPPER-README.md` (documentation)

---

## Verification

```bash
docker-compose up
# Wrapper on :3002, AnythingLLM on :3001

curl http://localhost:3002/health \
  -H "Authorization: Bearer test_token_for_dev"

curl -X POST http://localhost:3002/api/agent/knowledge/store \
  -H "Authorization: Bearer test_token_for_dev" \
  -d '{"content":"Test document"}'
```

---

## Summary

All 3 wrappers follow same pattern:
1. Types + Logger
2. Service-specific Adapter
3. Hono server with Bolek API
4. Docker compose
5. Tests

Now Codex can implement all three independently!
