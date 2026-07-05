import { Hono } from 'hono'
import type {
  BolekKnowledgeQuery,
  BolekStoreRequest,
  BolekQueryResponse,
  BolekStoreResponse,
  BolekCollection
} from './types'
import { AnythingLLMAdapter } from './adapter'
import { Logger } from './logger'

const app = new Hono()
const logger = new Logger(process.env.LOG_LEVEL as any || 'info')
const anythingLlmUrl = process.env.ANYTHINGLLM_URL || 'http://localhost:3001'
const adapter = new AnythingLLMAdapter(anythingLlmUrl, logger)
const expectedToken = process.env.BEARER_TOKEN || 'test_token_for_dev'

const validateAuth = (token: string): boolean => {
  return token === `Bearer ${expectedToken}`
}

app.post('/api/agent/knowledge/query', async (c) => {
  try {
    const auth = c.req.header('Authorization') || ''
    if (!validateAuth(auth)) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const request = await c.req.json<BolekKnowledgeQuery>()
    const response: BolekQueryResponse = await adapter.queryKnowledge(request)
    return c.json(response)
  } catch (error) {
    logger.error('Query endpoint error', { error: String(error) })
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post('/api/agent/knowledge/store', async (c) => {
  try {
    const auth = c.req.header('Authorization') || ''
    if (!validateAuth(auth)) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const request = await c.req.json<BolekStoreRequest>()
    const response: BolekStoreResponse = await adapter.storeDocument(request)
    return c.json(response)
  } catch (error) {
    logger.error('Store endpoint error', { error: String(error) })
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.get('/api/agent/knowledge/collections', async (c) => {
  try {
    const auth = c.req.header('Authorization') || ''
    if (!validateAuth(auth)) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const collections: BolekCollection[] = await adapter.listCollections()
    return c.json({ collections })
  } catch (error) {
    logger.error('List collections endpoint error', { error: String(error) })
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.delete('/api/agent/knowledge/documents/:id', async (c) => {
  try {
    const auth = c.req.header('Authorization') || ''
    if (!validateAuth(auth)) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id')
    const success = await adapter.deleteDocument(id)
    return c.json({ success })
  } catch (error) {
    logger.error('Delete document endpoint error', { error: String(error) })
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.delete('/api/agent/knowledge/collections/:name', async (c) => {
  try {
    const auth = c.req.header('Authorization') || ''
    if (!validateAuth(auth)) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const name = c.req.param('name')
    const success = await adapter.deleteCollection(name)
    return c.json({ success })
  } catch (error) {
    logger.error('Delete collection endpoint error', { error: String(error) })
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'bolek-kb-wrapper' })
})

const port = parseInt(process.env.PORT || '3002', 10)
export default app

if (import.meta.main) {
  console.log(`BolekKB Wrapper listening on http://localhost:${port}`)
}
