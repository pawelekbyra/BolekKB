# BolekKB Wrapper

Thin Bolek-specific wrapper for AnythingLLM knowledge base.

## Quick Start

```bash
npm install
npm run dev
```

Wrapper runs on http://localhost:3002
AnythingLLM runs on http://localhost:3001 (inside docker-compose)

## API Endpoints

All endpoints require Bearer token: `Authorization: Bearer test_token_for_dev`

### Query Knowledge Base
```bash
POST /api/agent/knowledge/query
Body: { query: string, topK?: number, threshold?: number, filters?: {...} }
Response: { results: [...], totalResults: number, executionTime: number }
```

### Store Document
```bash
POST /api/agent/knowledge/store
Body: { content: string, metadata?: { source?: string, collection?: string, tags?: string[] } }
Response: { documentId: string, indexed: boolean, message: string }
```

### List Collections
```bash
GET /api/agent/knowledge/collections
Response: { collections: [{ name: string, count: number, description?: string }] }
```

### Delete Document
```bash
DELETE /api/agent/knowledge/documents/:id
Response: { success: boolean }
```

### Delete Collection
```bash
DELETE /api/agent/knowledge/collections/:name
Response: { success: boolean }
```

### Health Check
```bash
GET /health
```

## Architecture

```
BolekAI (orchestrator)
  ↓ (HTTP POST)
BolekKB Wrapper (:3002)
  ├─ Translate Bolek knowledge request → AnythingLLM format
  ├─ Call AnythingLLM API (:3001)
  └─ Translate results → Bolek format
  ↓
AnythingLLM (:3001)
  └─ Execute semantic search, store documents, manage collections
```

## Files

- `src/index.ts` — Hono server with 5 endpoints
- `src/adapter.ts` — AnythingLLM API translation
- `src/logger.ts` — Structured logging
- `src/types.ts` — TypeScript interfaces
- `docker-compose.yml` — Run both wrapper + AnythingLLM
- `package.json` — Dependencies

## Running

With Docker:
```bash
docker-compose up
```

Locally:
```bash
npm install
npm run dev
```

## Testing

```bash
npm test
```

## Integration with BolekAI

BolekAI calls this wrapper to query knowledge:
- `POST http://localhost:3002/api/agent/knowledge/query`
- Wrapper translates to AnythingLLM format
- Returns search results ranked by relevance
- BolekAI can also store documents via `POST /api/agent/knowledge/store`

No direct calls from BolekAI to AnythingLLM.
