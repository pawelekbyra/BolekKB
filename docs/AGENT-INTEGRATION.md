# BolekKB — Agent Integration Architecture

> **Role in Bolek Network:** Knowledge Base & Information Retrieval Service
>
> BolekKB provides semantic search and document storage for Agent Bolek. It is a **passive knowledge provider** — it does not initiate actions or make decisions.

---

## 1. Role Definition

**What BolekKB Is:**
- Document storage and indexing
- Vector embeddings and semantic search
- RAG (Retrieval-Augmented Generation) backbone
- Knowledge collections and organization
- Document ingestion pipeline

**What BolekKB Is NOT:**
- Not a decision-maker (agent decides what to do with results)
- Not executable (returns data, not actions)
- Not a memory system (agent manages memory lifecycle)
- Not autonomous (responds to queries only)

---

## 2. Communication Flow

### BolekKB → BolekAI (Knowledge Provider)

BolekKB provides a **query interface** that BolekAI calls when it needs context.

```
Agent: "What have we decided about remote work?"
  ↓
BolekAI.orchestrator decides context is needed
  ↓
BolekAI calls kb_query tool
  ├─ query: "remote work policies"
  ├─ topK: 5 (return top 5 results)
  └─ filters?: { collection: "decisions" }
  ↓
BolekKB receives request
  ├─ converts query to embedding
  ├─ semantic search in vector store
  ├─ ranks by relevance
  └─ returns top documents
  ↓
Agent receives results
  ├─ uses knowledge in context for LLM
  ├─ cites sources in response
  └─ responds to user with references
```

---

## 3. API Contract: BolekKB ↔ BolekAI

### Endpoint: POST /api/agent/knowledge/query

Query the knowledge base.

**Request:**

```typescript
{
  query: string                     // User question or search term
  topK?: number                     // How many results (default: 5)
  threshold?: number                // Min relevance score (0-1, default: 0.3)
  filters?: {
    collection?: string             // Filter by collection
    source?: string                 // Filter by source (pdf, url, note, etc.)
    tags?: string[]                 // Filter by tags
    dateFrom?: string               // ISO date
    dateTo?: string
  }
}
```

**Response:**

```typescript
{
  success: boolean
  results: Array<{
    id: string                      // Document ID
    content: string                 // Excerpt or full content
    relevance: number               // 0-1 score
    metadata: {
      source: string                // Where it came from
      type: 'pdf' | 'url' | 'note' | 'message' | 'other'
      title?: string
      author?: string
      date?: string
      collection: string
      url?: string                  // If web document
      tags?: string[]
    }
  }>
  totalResults: number
  executionTime: number             // ms
  query: string                     // Echoed for logging
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/api/agent/knowledge/query \
  -H "Authorization: Bearer BOLEK_KB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What decisions did we make about pricing?",
    "topK": 5,
    "filters": {
      "collection": "decisions",
      "tags": ["pricing"]
    }
  }'

Response:
{
  "success": true,
  "results": [
    {
      "id": "doc_abc123",
      "content": "On 2025-11-20 we decided to implement tiered pricing...",
      "relevance": 0.94,
      "metadata": {
        "source": "decision_log",
        "type": "note",
        "date": "2025-11-20",
        "collection": "decisions",
        "tags": ["pricing", "product"]
      }
    },
    {
      "id": "doc_def456",
      "content": "Pricing strategy for 2026 includes annual discounts...",
      "relevance": 0.87,
      "metadata": {
        "source": "strategy_doc",
        "type": "pdf",
        "date": "2025-12-01",
        "collection": "decisions"
      }
    }
  ],
  "totalResults": 12,
  "executionTime": 145
}
```

### Endpoint: POST /api/agent/knowledge/store

Store a document in knowledge base.

**Request:**

```typescript
{
  content: string                   // Document text
  metadata: {
    source: string                  // Where it came from
    title?: string
    author?: string
    collection: string              // Which collection (decisions, research, etc.)
    tags?: string[]
    url?: string
    date?: string                   // When created/updated
  }
  embedding?: number[]              // Optional: pre-computed embedding
}
```

**Response:**

```typescript
{
  success: boolean
  documentId: string
  indexed: boolean                  // Was it added to vector store?
  message?: string
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/api/agent/knowledge/store \
  -H "Authorization: Bearer BOLEK_KB_TOKEN" \
  -d '{
    "content": "Decision: We will implement TypeScript across all services",
    "metadata": {
      "source": "agent_memory",
      "collection": "decisions",
      "tags": ["architecture", "typescript"],
      "date": "2026-01-15"
    }
  }'

Response:
{
  "success": true,
  "documentId": "doc_xyz789",
  "indexed": true
}
```

### Endpoint: GET /api/agent/knowledge/collections

List all knowledge collections.

**Response:**

```typescript
{
  collections: Array<{
    name: string
    description?: string
    documentCount: number
    sizeBytes: number
    lastUpdated: string
    tags?: string[]
  }>
}
```

**Example:**

```bash
curl http://localhost:3001/api/agent/knowledge/collections \
  -H "Authorization: Bearer BOLEK_KB_TOKEN"

Response:
{
  "collections": [
    {
      "name": "decisions",
      "description": "Strategic and architectural decisions",
      "documentCount": 47,
      "lastUpdated": "2026-01-15T14:30:00Z"
    },
    {
      "name": "research",
      "description": "Research notes and findings",
      "documentCount": 123,
      "lastUpdated": "2026-01-14T10:15:00Z"
    },
    {
      "name": "polutek_docs",
      "description": "Polutek.pl documentation",
      "documentCount": 34,
      "lastUpdated": "2026-01-10T09:00:00Z"
    }
  ]
}
```

### Endpoint: GET /api/agent/knowledge/documents/:docId

Get a specific document.

**Response:**

```typescript
{
  id: string
  content: string
  metadata: {
    source: string
    type: string
    title?: string
    author?: string
    date?: string
    collection: string
    url?: string
    tags?: string[]
  }
  createdAt: string
  updatedAt: string
}
```

### Endpoint: DELETE /api/agent/knowledge/documents/:docId

Remove a document from knowledge base.

**Response:**

```typescript
{
  success: boolean
  documentId: string
  message: string
}
```

### Endpoint: POST /api/agent/knowledge/update/:docId

Update document metadata or content.

**Request:**

```typescript
{
  content?: string
  metadata?: {
    // Updated fields
    tags?: string[]
    title?: string
  }
}
```

---

## 4. Knowledge Organization

### Collections

Organize documents into logical collections:

- **decisions** — Strategic and architectural decisions
- **research** — Research findings and analysis
- **documentation** — Product and service docs
- **polutek_docs** — Polutek-specific information
- **conversations** — Important conversations (archived)
- **best_practices** — Team standards and patterns
- **financial** — Financial data and analysis

### Tags

Tag documents for filtering:

```
Document: "Pricing strategy 2026"
Tags: ["pricing", "strategy", "2026", "product", "finance"]

Document: "TypeScript migration plan"
Tags: ["architecture", "typescript", "migration", "tech-debt"]

Document: "Polutek revenue report Jan 2026"
Tags: ["polutek", "finance", "revenue", "monthly"]
```

Agent can query with filters:
```
"Show decisions tagged 'pricing' from collection 'decisions'"
→ filters: { collection: "decisions", tags: ["pricing"] }
```

---

## 5. Document Types

### Supported Sources

- **note** — User-created notes from agent memory
- **pdf** — Uploaded PDF documents
- **url** — Web pages (archived content)
- **email** — Email messages (archived)
- **conversation** — Chat transcripts
- **decision_log** — Structured decision records
- **code** — Source code snippets
- **other** — Unclassified

---

## 6. Ingestion Pipeline

### How Documents Get Into BolekKB

#### Via Agent Memory

Agent learns something → proposes to remember → stores in KB:

```
Agent: "Should I remember: 'You prefer morning meetings'?"
User: "Yes"
  ↓
Agent calls kb_store
  ├─ content: "Prefers morning meetings"
  ├─ metadata: { source: "agent_memory", collection: "preferences" }
  └─ BolekKB indexes it
```

#### Via Web Import

Agent researches a topic → saves relevant URLs:

```
Agent: "I found 3 articles about Cloudflare Workers"
  ├─ Saves URL 1 to KB (collection: "research", source: "web")
  ├─ Saves URL 2 to KB
  └─ Saves URL 3 to KB
```

#### Via Manual Upload

User uploads documents through BolekKB UI or API:

```
POST /api/agent/knowledge/store
{
  "content": "[PDF extracted text]",
  "metadata": { "source": "pdf", "title": "Annual Report 2025" }
}
```

#### Via File Ingestion

Collector service processes files (PDFs, Word, etc.):

```
BolekKB collector/
├── PDF processor → extracts text → embeddings
├── URL processor → fetch content → embeddings
├── OCR processor → images → text → embeddings
└── Audio processor → transcription → embeddings
```

---

## 7. Semantic Search

### How It Works

```
1. User asks: "What decisions have we made about TypeScript?"

2. Agent calls kb_query with:
   {
     query: "What decisions have we made about TypeScript?",
     filters: { collection: "decisions" }
   }

3. BolekKB:
   a) Converts query to embedding vector
   b) Searches vector database for similar documents
   c) Ranks by cosine similarity
   d) Applies filters (only "decisions" collection)
   e) Returns top 5 results with relevance scores

4. Agent receives:
   [
     { content: "Decided to use TypeScript...", relevance: 0.92 },
     { content: "TypeScript implementation plan...", relevance: 0.87 },
     ...
   ]

5. Agent uses these in context when responding
```

### Relevance Scoring

Results scored 0-1:
- **0.9+** = Highly relevant, cite directly
- **0.7-0.9** = Relevant, use with context
- **0.5-0.7** = Somewhat relevant, mention if helpful
- **<0.5** = Filter out (set threshold)

---

## 8. Authentication & Access

### BolekKB → BolekAI Auth

BolekKB has `BOLEK_API_TOKEN`:

```env
BOLEK_API_URL=https://kulfon.pawel-perfect.workers.dev
BOLEK_API_TOKEN=... (shared secret)
```

All requests from BolekAI:
```
Authorization: Bearer BOLEK_KB_TOKEN
```

### Document Access Control

For multi-user systems (future), control who sees what:

```typescript
// Currently (single owner):
// All documents accessible to authenticated agent

// Future (if multi-user):
{
  "document": {...},
  "accessControl": {
    "owner": "pawel",
    "visibility": "private" | "shared" | "public"
  }
}
```

---

## 9. Development Setup

### Local Testing

```bash
# Terminal 1: BolekKB (AnythingLLM or similar)
docker-compose up -d bolekkb    # runs on localhost:3001

# Terminal 2: BolekAI
cd /home/user/BolekAI
npm run dev                      # http://localhost:8787

# .env for BolekAI
KB_SERVICE_URL=http://localhost:3001
KB_SERVICE_TOKEN=test_token_dev
```

### Test via curl

```bash
# Store a document
curl -X POST http://localhost:3001/api/agent/knowledge/store \
  -H "Authorization: Bearer test_token_dev" \
  -d '{
    "content": "TypeScript is our primary language",
    "metadata": {
      "source": "decision",
      "collection": "decisions",
      "tags": ["typescript"]
    }
  }'

# Query it
curl -X POST http://localhost:3001/api/agent/knowledge/query \
  -H "Authorization: Bearer test_token_dev" \
  -d '{
    "query": "What language do we use?",
    "topK": 5
  }'
```

---

## 10. Performance & Scaling

### Indexing

Documents are indexed with embeddings:
- **Embedding model:** OpenAI ada, or local model
- **Vector DB:** Pinecone, Weaviate, or local SQLite with pgvector
- **Indexing latency:** < 100ms per document (async)

### Query Performance

Typical query time:
- **< 50ms** for semantic search in vector DB
- **100-200ms** with filtering and ranking
- **Target:** < 500ms end-to-end

### Scaling

If knowledge base grows large:
- Use pagination for result sets
- Implement caching (Redis) for frequent queries
- Archive old documents
- Use distributed vector DB

---

## 11. Monitoring

### What to Track

- **Query count:** How many searches per day?
- **Search latency:** How fast are queries?
- **Storage size:** How much data stored?
- **Hit rate:** How relevant are results?
- **Most-searched terms:** What do users ask about?

### Metrics Example

```typescript
{
  query: "TypeScript architecture",
  resultCount: 5,
  relevanceScores: [0.92, 0.87, 0.74, 0.61, 0.52],
  executionTime: 145,
  filters: { collection: "decisions" },
  timestamp: "2026-01-15T10:00:00Z"
}
```

---

## 12. Security

### Never In BolekKB

- ❌ Secrets or API keys
- ❌ Passwords or tokens (even test ones)
- ❌ Personal financial data
- ❌ Health information

### Safe to Store

- ✅ Decisions and strategy
- ✅ Research and analysis
- ✅ Documentation
- ✅ Meeting notes
- ✅ Code snippets
- ✅ Non-sensitive project data

---

## 13. Workflow: RAG with BolekKB

**RAG = Retrieval-Augmented Generation**

How agent uses knowledge to answer better:

```
User: "Should we hire more engineers?"

Agent receives question
  ↓
Agent calls kb_query("hiring engineers")
  ├─ Searches for: hiring decisions, team plans, budget info
  └─ Gets: [past decision, team plan, capacity analysis]
  ↓
Agent uses results in LLM context:
  "Based on our past decisions, here's what we decided:
   [cite result 1]
   
   Here's our current plan:
   [cite result 2]
   
   Given that, my recommendation is..."
  ↓
Agent responds with citations
  └─ "According to [decision_doc], we decided..."
```

---

## 14. Deletion & Privacy

### Deleting Documents

User can remove documents:

```bash
DELETE /api/agent/knowledge/documents/doc_abc123
```

BolekKB should:
- ✅ Remove from vector DB immediately
- ✅ Remove from metadata index
- ✅ Keep audit log (what was deleted, when)
- ✅ Respond immediately (< 100ms)

### Privacy Considerations

- User owns all documents
- User can export all knowledge at any time
- User can delete everything
- No tracking of searches for analytics (optional: opt-in only)

---

## 15. Architecture Summary

```
BolekAI (Cloudflare)
├── Needs context for answering
├── LLM asks: "What's relevant here?"
└── Calls /api/agent/knowledge/query
        ↓
BolekKB (Vector DB + Embeddings)
├── Converts query to embedding
├── Semantic search in vector store
├── Ranks by relevance
└── Returns top documents with citations
        ↓
BolekAI
├── Receives documents
├── Incorporates into LLM context
├── Responds with citations
└── Optionally: stores query result as memory
```

---

## 16. Related Docs

- [`docs/BOLEK-NETWORK.md`](../BolekAI/docs/BOLEK-NETWORK.md) — High-level ecosystem
- [`docs/MULTI-AGENT-ARCHITECTURE.md`](../BolekAI/docs/MULTI-AGENT-ARCHITECTURE.md) — Detailed tri-tier design
- [AnythingLLM Docs](https://docs.anythingllm.com/) — Knowledge base engine docs

---

## Key Principle

> **BolekKB is a knowledge library, not a brain.**
>
> It stores documents. It does not decide what to do with them.
> It answers queries. It does not initiate searches.
> It provides context. It does not make decisions.
>
> BolekAI is the **decision-maker**. BolekKB is the **context provider**.
