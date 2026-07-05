import { AnythingLLMAdapter } from '../adapter'
import { Logger } from '../logger'

describe('AnythingLLMAdapter', () => {
  let adapter: AnythingLLMAdapter
  let logger: Logger

  beforeEach(() => {
    logger = new Logger('debug')
    adapter = new AnythingLLMAdapter('http://localhost:3001', logger)
  })

  it('should query knowledge base and return results', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        documents: [
          {
            id: 'doc_1',
            content: 'Sample knowledge content',
            pageContent: 'Sample knowledge content',
            score: 0.95,
            metadata: { source: 'test', collection: 'default' }
          }
        ]
      })
    })

    const result = await adapter.queryKnowledge({
      query: 'test query',
      topK: 5
    })

    expect(result.results).toHaveLength(1)
    expect(result.results[0].content).toBe('Sample knowledge content')
    expect(result.results[0].relevance).toBe(0.95)
  })

  it('should store document', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        documentId: 'doc_123',
        indexed: true,
        message: 'Document stored'
      })
    })

    const result = await adapter.storeDocument({
      content: 'Test document content',
      metadata: { collection: 'test' }
    })

    expect(result.documentId).toBe('doc_123')
    expect(result.indexed).toBe(true)
  })

  it('should list collections', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        collections: [
          { name: 'default', documentCount: 10, description: 'Default collection' },
          { name: 'archive', documentCount: 5 }
        ]
      })
    })

    const collections = await adapter.listCollections()

    expect(collections).toHaveLength(2)
    expect(collections[0].name).toBe('default')
    expect(collections[0].count).toBe(10)
  })

  it('should delete document', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    const success = await adapter.deleteDocument('doc_123')

    expect(success).toBe(true)
  })

  it('should delete collection', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    const success = await adapter.deleteCollection('archive')

    expect(success).toBe(true)
  })
})
