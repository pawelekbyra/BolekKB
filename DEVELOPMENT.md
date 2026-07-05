# BolekKB — Development Guide

> How to develop and extend the knowledge base service.

---

## Quick Start

```bash
# Setup (AnythingLLM-based)
docker-compose up -d bolekkb    # Starts on :3001

# Access UI
# http://localhost:3001

# Test API
curl -X POST http://localhost:3001/api/agent/knowledge/query \
  -H "Authorization: Bearer token" \
  -d '{"query":"test"}'

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

---

## Architecture

BolekKB is a **knowledge provider** that returns relevant documents.

```
BolekAI (agent)
  ├─ needs context
  ├─ POSTs to /api/agent/knowledge/query
  └─ uses results in LLM context
       ↓
BolekKB (vector DB)
  ├─ converts query to embedding
  ├─ semantic search
  ├─ ranks by relevance
  └─ returns documents with scores
```

---

## Ingestion Pipeline

### How Documents Get In

#### 1. Via Agent Memory
```
Agent learns: "You prefer morning meetings"
  ↓
POST /api/agent/knowledge/store
{
  "content": "Prefers morning meetings",
  "metadata": {
    "source": "agent_memory",
    "collection": "preferences",
    "date": "2026-01-15"
  }
}
  ↓
BolekKB indexes and embeds
```

#### 2. Via Web Upload
```
User uploads PDF
  ↓
BolekKB extracts text (PDF processor)
  ↓
Create embeddings
  ↓
Store in vector DB with metadata
```

#### 3. Via API (Batch Import)
```
POST /api/agent/knowledge/store
{
  "content": "[article text]",
  "metadata": {
    "source": "web_article",
    "url": "https://...",
    "collection": "research"
  }
}
```

---

## Collections

Organize documents logically:

```
decisions/           # Strategic decisions
research/            # Research and analysis
documentation/       # Product/service docs
polutek_docs/        # Polutek-specific
conversations/       # Archived chats
best_practices/      # Team standards
financial/           # Financial data
```

Create collections via UI or API:

```bash
curl -X POST http://localhost:3001/api/agent/collections \
  -d '{
    "name": "decisions",
    "description": "Strategic and architectural decisions",
    "tags": ["strategy", "architecture"]
  }'
```

---

## Semantic Search

### How It Works

```
Query: "What decisions have we made about TypeScript?"
  ↓
BolekKB:
1. Embed query (OpenAI ada or local model)
2. Vector similarity search (cosine distance)
3. Rank by relevance (0-1 score)
4. Apply filters (collection, tags, date range)
5. Return top K results
  ↓
Results:
[
  { content: "...", relevance: 0.92, ... },
  { content: "...", relevance: 0.87, ... },
  ...
]
```

### Tuning Search

```bash
# Adjust threshold
POST /api/agent/knowledge/query
{
  "query": "TypeScript",
  "threshold": 0.5,  # Return results > 0.5 relevance
  "topK": 10         # Return top 10 results
}
```

---

## API Implementation

### Endpoint: POST /api/agent/knowledge/query

```typescript
// Express handler
app.post('/api/agent/knowledge/query', async (req, res) => {
  const { query, topK = 5, threshold = 0.3, filters } = req.body
  
  // Validate auth
  if (!req.headers.authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  // Embed query
  const queryEmbedding = await embedText(query)
  
  // Search vector DB
  const results = await vectorDb.search(queryEmbedding, {
    limit: topK,
    threshold,
    filter: filters?.collection,
    tags: filters?.tags
  })
  
  // Format response
  res.json({
    success: true,
    results: results.map(r => ({
      id: r.id,
      content: r.content,
      relevance: r.score,
      metadata: r.metadata
    })),
    totalResults: results.length,
    executionTime: Date.now() - startTime
  })
})
```

---

## Indexing

### Automatic Indexing
```bash
# When storing a document:
POST /api/agent/knowledge/store
{
  "content": "Document text",
  "metadata": {...}
}
# → Automatically embedded and indexed
```

### Batch Indexing
```bash
# Re-index all documents
curl -X POST http://localhost:3001/api/agent/knowledge/reindex

# Or specific collection
curl -X POST http://localhost:3001/api/agent/knowledge/reindex/decisions
```

---

## Embedding Models

### Options

```
Local:
- Sentence transformers (all-MiniLM-L6-v2)
- Ort (lightweight)

Cloud:
- OpenAI ada (ada-002)
- Anthropic (future)
```

Configure in `.env`:

```env
EMBEDDING_MODEL=openai:ada-002
EMBEDDING_API_KEY=sk-...
```

### Performance
- Local: < 10ms per document
- Cloud: 50-200ms per document

---

## Vector DB Options

```
SQLite (default):
- Fast for < 100k documents
- No external service needed

pgvector (PostgreSQL):
- Scalable to millions
- Better performance

Pinecone (cloud):
- Managed, serverless
- Expensive but reliable
```

Set in docker-compose:

```yaml
services:
  bolekkb:
    environment:
      VECTOR_DB: pgvector
      POSTGRES_URL: postgres://...
```

---

## Testing Search

```bash
# Terminal 1: Start BolekKB
docker-compose up -d

# Terminal 2: Add test documents
curl -X POST http://localhost:3001/api/agent/knowledge/store \
  -H "Authorization: Bearer test" \
  -d '{
    "content": "TypeScript is our primary language",
    "metadata": {
      "source": "decision",
      "collection": "decisions",
      "tags": ["typescript", "architecture"]
    }
  }'

# Terminal 3: Query
curl -X POST http://localhost:3001/api/agent/knowledge/query \
  -H "Authorization: Bearer test" \
  -d '{
    "query": "What language do we use?",
    "topK": 5
  }'

# Should return the stored document with high relevance
```

---

## Monitoring

### What to Track

- **Query volume:** How many searches/day?
- **Search latency:** How fast are responses?
- **Index size:** How many documents?
- **Hit rate:** Do results match the query?
- **Update latency:** How long to index new doc?

### Metrics Dashboard

```bash
# Export metrics
GET /api/agent/knowledge/metrics

{
  "totalDocuments": 1234,
  "collectionCount": 5,
  "indexSize": "256MB",
  "averageQueryTime": 125,  // ms
  "queriesPerDay": 5000,
  "updateLatency": 50
}
```

---

## Cleanup & Maintenance

### Delete Old Documents

```bash
# Delete by ID
DELETE /api/agent/knowledge/documents/:docId

# Delete by collection
DELETE /api/agent/knowledge/collections/:collectionName

# Prune old documents (auto-delete after N days)
POST /api/agent/knowledge/cleanup
{
  "olderThanDays": 365,
  "collections": ["research"]  // optional filter
}
```

---

## Privacy & Security

### What NOT to Store

- ❌ Secrets or API keys
- ❌ Passwords
- ❌ Personal financial data
- ❌ Health information

### Safe to Store

- ✅ Decisions and strategy
- ✅ Research and analysis
- ✅ Documentation
- ✅ Code snippets
- ✅ Meeting notes

---

## Environment Setup

```env
# Agent connection
BOLEK_API_URL=https://kulfon.pawel-perfect.workers.dev
BOLEK_API_TOKEN=...

# Vector DB
VECTOR_DB=sqlite
DATABASE_URL=sqlite:./data/bolekkb.db

# Embedding
EMBEDDING_MODEL=local
EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2

# Performance
BATCH_SIZE=32
SEARCH_THRESHOLD=0.3
MAX_RESULTS=100
```

---

## Deployment

```bash
# Local development
docker-compose up -d bolekkb

# Production (with PostgreSQL)
docker-compose -f docker-compose.prod.yml up -d

# Verify
curl http://localhost:3001/api/agent/knowledge/collections \
  -H "Authorization: Bearer BOLEK_KB_TOKEN"
```

---

## Current Phase

See [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for what's next.
