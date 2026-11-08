# 120-ARTICLE CAMPAIGN IMPLEMENTATION & EXECUTION FRAMEWORK

**Scope:** Technical Execution of the 60-Day Campaign, Scheduling Pipeline, and State Transition Logic

---

## 1. QUEUE AND RETRY ORCHESTRATION

The campaign relies on a robust state machine implemented in the publishing queue:

```
[TOPIC_PLANNED] → [RESEARCHING] → [GENERATING] → [QUALITY_CHECK] → [SCHEDULED] → [PUBLISHED]
                                         ↓ (Failure)
                                   [QUALITY_REWRITE] → [FAILED / SKIPPED]
```

### Idempotency & Concurrency Defenses:
1. **Deterministic Job Identifier:** Each publishing task is assigned a compound key `publish:{slot_date}:{slot_hour}:{article_slug}`.
2. **Double-Publication Barrier:** The ingestion worker evaluates `isArticlePubliclyVisible()` and checks the local catalog. If `publishedAt` is already committed, the job exits cleanly with zero side-effects.
3. **Automatic Fallback Logging:** In the event of an upstream generation timeout or unapproved draft status, the slot is gracefully **skipped** and recorded in `SCHEDULER_AUDIT_LOGS` rather than blocking the worker queue.

---

## 2. METADATA SYNCHRONIZATION

Upon publication:
1. Article record status updates to `editorialStatus: 'Approved'` and `publicationStatus: 'Published'`.
2. `publishedAt` is locked to the slot timestamp.
3. Next.js Incremental Static Regeneration re-renders `/`, `/articles`, and `/sitemap.xml`.
