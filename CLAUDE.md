# BolekKB — AnythingLLM Wrapper

## Project Overview

BolekKB is a **specialized wrapper** around AnythingLLM that integrates knowledge base management into the Bolek multi-agent system.

**Role in Architecture:**
- Part of the tri-tier Bolek system (alongside BolekCzat and BolekFlow)
- Communicates with BolekAI orchestrator via HTTP API
- Manages knowledge base operations: query, store, delete
- Independently deployed and scaled

## Quick Reference

| Aspect | Technology |
|--------|-----------|
| Runtime | Node.js + TypeScript |
| Web Framework | Hono.js (minimal, edge-ready) |
| Upstream | AnythingLLM (forked, unchanged) |
| Wrapper Code | `/wrapper` directory |
| Database | AnythingLLM's built-in SQLite |

## Structure

```
BolekKB/
├── wrapper/              # Bolek-specific wrapper code (TypeScript)
│   ├── src/
│   │   ├── types.ts      # Knowledge base types
│   │   ├── logger.ts     # Structured logging
│   │   ├── adapter.ts    # AnythingLLMAdapter (query, store, delete)
│   │   └── index.ts      # Hono server with 5 endpoints
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env.example
├── (original AnythingLLM files untouched)
└── Bolek-specific docs
    ├── DEVELOPMENT.md      # How to develop locally
    ├── PROJECT_STATUS.md   # Phase tracking
    ├── WRAPPER-STRUCTURE.md # Detailed wrapper architecture
    ├── WRAPPER-SETUP.md    # 10-step implementation checklist
    └── CODEX-PROMPT.md     # Instructions for Codex agent
```

## Key Points for Agents

### 1. Keep the Fork Clean
- AnythingLLM code is **completely untouched**
- All Bolek customization lives in `/wrapper`
- This allows easy upstream updates

### 2. HTTP API Contract
The wrapper exposes 5 endpoints that BolekAI calls:
- `POST /api/knowledge/query` — Search knowledge base
- `POST /api/knowledge/store` — Add documents/facts
- `POST /api/knowledge/delete` — Remove items
- `GET /api/knowledge/health` — Service health check
- `POST /api/knowledge/sync` — Sync with AnythingLLM

### 3. Bearer Token Auth
All requests from BolekAI include:
```
Authorization: Bearer ${BOLEK_KB_API_KEY}
```

### 4. Deployment
```bash
# Local development
cd wrapper && npm install && npm run dev

# Docker (production)
docker-compose up -d

# Wrapper runs on port 3001 by default
# AnythingLLM runs on port 3001 internally, wrapper exposes standardized API
```

## Development Workflow

1. **Read DEVELOPMENT.md** for setup and testing
2. **Check PROJECT_STATUS.md** for current phase
3. **Review WRAPPER-STRUCTURE.md** for adapter details
4. **Follow WRAPPER-SETUP.md** for implementation checklist

## Integration with BolekAI

BolekAI treats BolekKB as a tool:
```typescript
// BolekAI orchestrator calls:
const result = await kb_query({ query: "What is my schedule?" });
const stored = await kb_store({ type: "fact", content: "..." });
```

Health checks verify connectivity:
```typescript
GET https://bolek-kb.service/api/knowledge/health
```

## TypeScript Guidelines

- **No `any` types** — use explicit types
- **Use adapter pattern** — all AnythingLLM calls go through `/wrapper/src/adapter.ts`
- **Immutable data** — don't mutate API responses
- **Error handling** — always return `{ success: false, error: "..." }`

## Environment Variables

See `/wrapper/.env.example`:
- `ANYTHING_LLM_API_URL` — AnythingLLM internal endpoint
- `ANYTHING_LLM_API_KEY` — AnythingLLM admin key
- `BOLEK_KB_API_KEY` — Bearer token for BolekAI requests
- `BOLEK_KB_PORT` — Wrapper server port (default: 3001)
- `NODE_ENV` — development or production

## Common Tasks

| Task | Where |
|------|-------|
| Add new endpoint | `wrapper/src/index.ts` |
| Change AnythingLLM API call | `wrapper/src/adapter.ts` |
| Update types | `wrapper/src/types.ts` |
| Write tests | `wrapper/src/__tests__/*.test.ts` |
| Debug logging | `wrapper/src/logger.ts` |

## Notes for Codex

See **CODEX-PROMPT.md** for detailed, turn-by-turn implementation instructions when working on this repo.

Key principle: **Keep it thin.** The wrapper is a translation layer, not a rewrite. The more logic you push into AnythingLLM's codebase, the harder it becomes to maintain.
