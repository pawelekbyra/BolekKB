# BolekKB Wrapper — Structure & Architecture

> BolekKB is a **thin wrapper** around AnythingLLM (forked, unmodified).
> The wrapper exposes Bolek-specific knowledge API endpoints.

---

## Directory Structure

```
BolekKB/
├── fork/                          # AnythingLLM fork (unmodified)
│   ├── frontend/
│   ├── backend/
│   ├── docker-compose.yml
│   └── ...
│
├── src/                           # Wrapper (TypeScript/Node.js)
│   ├── index.ts                   # Entry point, Hono app
│   ├── adapter.ts                 # Translate Bolek ↔ AnythingLLM
│   ├── types.ts                   # Wrapper-specific types
│   └── logger.ts                  # Structured logging
│
├── docker-compose.yml             # Runs both: wrapper + AnythingLLM fork
├── package.json                   # Wrapper dependencies
├── WRAPPER-SETUP.md               # Implementation guide
└── fork-README.md                 # Original AnythingLLM README
```

---

## Wrapper Responsibilities

**The wrapper:**
- ✅ Listens on `:3002` (Bolek-facing)
- ✅ Calls AnythingLLM internally (on `:3001`)
- ✅ Implements Bolek knowledge API (query, store, list collections)
- ✅ Translates Bolek format ↔ AnythingLLM format
- ✅ Handles auth (Bearer token)
- ✅ Structured logging

**AnythingLLM (fork) does:**
- ✅ Runs on `:3001` (wrapper-facing)
- ✅ Manages documents and embeddings
- ✅ Performs semantic search
- ✅ Stays completely unmodified

---

## API Endpoints

### Wrapper (Bolek-facing) — Port 3002

```
POST /api/agent/knowledge/query
  Input: { query: string, topK?: number, threshold?: number, filters?: {...} }
  Output: { results: [{content, relevance, metadata}], totalResults: number }
  Auth: Bearer token

POST /api/agent/knowledge/store
  Input: { content: string, metadata: {...} }
  Output: { documentId: string, indexed: boolean }
  Auth: Bearer token

GET /api/agent/knowledge/collections
  Input: (none)
  Output: { collections: [{name, count, description}] }
  Auth: Bearer token

DELETE /api/agent/knowledge/documents/:docId
  Input: docId in path
  Output: { success: boolean, deleted: string }
  Auth: Bearer token

DELETE /api/agent/knowledge/collections/:name
  Input: collection name in path
  Output: { success: boolean, deletedCount: number }
  Auth: Bearer token
```

### AnythingLLM (fork-facing) — Port 3001

```
POST /api/v1/workspace/chat
  (AnythingLLM native endpoint — for search queries)

POST /api/v1/workspace/document
  (AnythingLLM native endpoint — for storing documents)

GET /api/v1/workspace/documents
  (AnythingLLM native endpoint — list documents)
```

---

## Implementation Phases

### Phase 1: Wrapper Scaffold
- Create `src/index.ts` with Hono server
- Create `docker-compose.yml` that starts both wrapper + fork
- Wrapper listens on :3002, calls fork on :3001

### Phase 2: Adapter Layer
- Create `src/adapter.ts`
- Implement semantic search → AnythingLLM translation
- Implement document storage ← AnythingLLM translation

### Phase 3: Bolek API Endpoints
- POST /api/agent/knowledge/query (semantic search)
- POST /api/agent/knowledge/store (add documents)
- GET /api/agent/knowledge/collections (list collections)
- DELETE /api/agent/knowledge/documents/:docId (delete by ID)
- DELETE /api/agent/knowledge/collections/:name (delete collection)

### Phase 4: Testing & Polish
- Unit tests for adapter
- Error handling (service down, timeout)
- Logging

---

## Communication Flow

```
BolekAI (orchestrator)
  ↓ (HTTP POST)
  BolekKB Wrapper (:3002)
    ├─ Receive knowledge query/store request
    ├─ Translate to AnythingLLM format
    ├─ Call AnythingLLM API (:3001)
    ├─ Receive search results or confirmation
    ├─ Translate back to Bolek format
    └─ Return to BolekAI
  ↓
  AnythingLLM Fork (:3001)
    ├─ Convert query to embedding
    ├─ Search vector database
    ├─ Rank by relevance
    └─ Return documents
```

---

## Development Workflow

```bash
# 1. Start both wrapper + fork
docker-compose up

# 2. Access AnythingLLM UI (optional)
# http://localhost:3001

# 3. Test wrapper
curl -X POST http://localhost:3002/api/agent/knowledge/query \
  -H "Authorization: Bearer test_token" \
  -d '{"query":"TypeScript decisions"}'

# 4. Store document
curl -X POST http://localhost:3002/api/agent/knowledge/store \
  -H "Authorization: Bearer test_token" \
  -d '{"content":"TypeScript is our primary language"}'
```

---

## Environment Variables

### Wrapper (.env)
```env
NODE_ENV=development
LOG_LEVEL=info
BOLEK_API_TOKEN=test_token_for_dev
ANYTHINGLLM_URL=http://anythingllm:3001
WRAPPER_PORT=3002
```

### AnythingLLM fork (fork/.env)
```env
STORAGE_DIR=/app/storage
LLM_PROVIDER=openai  # or local
```

---

## Testing Strategy

### Unit Tests
- Test adapter translation (Bolek ↔ AnythingLLM)
- Mock AnythingLLM responses
- Test search relevance scoring

### Integration Tests
- Start both wrapper + mock AnythingLLM
- Test document storage and retrieval

### End-to-End
- Real wrapper + real AnythingLLM
- Store document
- Search and verify ranking

---

## Maintenance

### Upgrading AnythingLLM Fork
```bash
cd fork/
git fetch upstream
git merge upstream/main
docker-compose build anythingllm
```

Wrapper stays clean.

---

## Next Steps

See [WRAPPER-SETUP.md](WRAPPER-SETUP.md) for implementation.
