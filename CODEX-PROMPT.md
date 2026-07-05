# CODEX-PROMPT — Start Here

> Copy the text below and send it to Codex to start implementing the wrapper.

---

## Prompt for Codex

```
You are working in repository /home/user/BolekKB on branch claude/multi-repo-agent-j3bo9v.

Read the file WRAPPER-SETUP.md in this repo.

Implement BolekKB wrapper according to those instructions, in order.

BolekKB is a thin TypeScript wrapper around AnythingLLM (forked, unmodified).

Tasks 1-10:

1. Initialize wrapper package.json with Hono dependencies
2. Create TypeScript config (tsconfig.json)
3. Define wrapper types (src/types.ts) for Bolek/AnythingLLM formats
4. Implement logger (src/logger.ts)
5. Implement AnythingLLM adapter (src/adapter.ts) for knowledge operations
   - queryKnowledge(request) → semantic search
   - storeDocument(request) → add document
   - listCollections() → list collections
   - deleteDocument(docId) → delete by ID
   - deleteCollection(name) → delete collection
6. Create Hono server (src/index.ts) with knowledge endpoints
7. Add Docker compose (docker-compose.yml) for wrapper + AnythingLLM
8. Create environment config (.env.example, .env)
9. Write unit tests (src/__tests__/adapter.test.ts)
10. Create README (WRAPPER-README.md)

Each task in WRAPPER-SETUP.md includes:
- Exact file path
- Complete code snippets to copy
- Commit message

After each task:
1. Commit: git commit -m "..."
2. Continue to next task
3. After all tasks: git push -u origin claude/multi-repo-agent-j3bo9v

If stuck:
- Read WRAPPER-STRUCTURE.md for architecture
- Check AnythingLLM API docs in fork/
- Verify Docker network

Start with Task 1 (package.json).
```

---

## How to Use

1. Copy the prompt above
2. Send to Codex
3. Codex follows WRAPPER-SETUP.md
4. Should complete in 3-5 turns

---

## What Gets Built

Knowledge wrapper (~500 lines):
- `package.json` — Hono + deps
- `tsconfig.json`
- `src/types.ts` — Knowledge format types
- `src/logger.ts`
- `src/adapter.ts` — AnythingLLM API translation
- `src/index.ts` — Hono server (5 endpoints)
- `docker-compose.yml`
- `src/__tests__/adapter.test.ts`
- `.env` config

Result: Bolek-compatible knowledge API at http://localhost:3002

---

## Expected Endpoints

After Codex finishes:
- `POST /api/agent/knowledge/query` — Semantic search
- `POST /api/agent/knowledge/store` — Add document
- `GET /api/agent/knowledge/collections` — List collections
- `DELETE /api/agent/knowledge/documents/:docId` — Delete document
- `DELETE /api/agent/knowledge/collections/:name` — Delete collection

All with Bearer token auth.

---

## Timeline

3-5 turns total.
