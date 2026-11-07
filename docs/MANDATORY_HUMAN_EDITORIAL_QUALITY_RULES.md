# MANDATORY HUMAN EDITORIAL QUALITY STANDARD & PUBLISHING GOVERNANCE
## AIsoftware Engineering & Editorial Protocol

**Standard Code:** `STD-ED-2026-01`  
**Applicability:** All 40 planned technical articles across AIsoftware  
**Enforcement:** Non-bypassable quality gateway; overrides generation speed or superficial word count  
**Effective Date:** November 7, 2026  

---

## 1. Natural Human Writing Standards

1. **Conversational Professionalism:**
   - Articles must read as an experienced systems architect explaining complex concepts to a peer.
   - Varied sentence pacing: mix concise declarations with explanatory compound sentences.
2. **Prohibited Filler & Banned Openings:**
   - **Strictly Banned Openings:** *"In today's digital world..."*, *"In the rapidly evolving landscape of AI..."*, *"Let's dive in..."*, *"In this fast-paced era..."*, *"Imagine a world where..."*.
   - **Strictly Banned Closings:** Generic restatements that merely list section headings without offering practical next architectural decisions.
3. **No Keyword Stuffing:**
   - Keywords must appear only where grammatically natural to the engineering problem. Never warp syntax to fit a target search query.

---

## 2. Real Problem-Driven Content Architecture

1. **Opening Hook:**
   - Every article must start with a concrete, frustrating technical bottleneck or real engineering limitation (e.g. socket timeouts, runaway memory leaks, unexpected token bills, non-deterministic model outputs).
2. **Negative Scenarios ("When NOT to use this"):**
   - Each article must explicitly dedicate a section to when the proposed technique or architecture is **inappropriate** (e.g., when a simple cron job or stateless function is superior to a multi-agent queue).
3. **Factual Integrity:**
   - No fabricated benchmarks. No simulated clients or invented production case studies.
   - Document only verified configurations, local tests, and authoritative specifications.

---

## 3. Technical Depth & Verifiable Code

1. **Executable Code & Configuration:**
   - Every code snippet or Docker configuration must be syntactically valid and reproducible.
   - Specify prerequisites, library versions, and OS/hardware assumptions (e.g., Node.js 22 LTS, Redis 7.2, Ollama 0.5.x, minimum RAM).
2. **Failure Modes & Debugging:**
   - Document common developer mistakes, edge cases, stack traces, and how to debug them.
3. **Trade-Off Analysis:**
   - Transparently weigh latency, memory overhead, operational complexity, and infrastructure trade-offs.

---

## 4. Originality & Visual Requirements

1. **Unique Intent:**
   - Each article must serve its own search intent. Zero reuse of introductions, stock paragraphs, or boilerplate definitions across posts.
2. **Word Count Strict Range:**
   - **1,400 to 2,000 meaningful body words** (excluding navigation, code syntax blocks, metadata, and captions).
3. **Visual Asset Mandate:**
   - **One unique, title-specific featured hero image** (1200x630 vector SVG, high-contrast dark architectural theme).
   - **At least two unique, technical in-article diagrams** (state machines, memory topologies, sequence flows, data pipelines).
   - Descriptive `alt` text and informative captions on every image. Zero generic stock visuals.

---

## 5. Editorial Lifecycle States

Every article must track and reflect its genuine lifecycle state:

```
[DRAFT] ──> [TECHNICAL_REVIEW] ──> [EDITORIAL_REVIEW] ──> [APPROVED] ──> [PUBLISHED]
```

- **DRAFT:** Raw content structured from topic outline and search intent.
- **TECHNICAL_REVIEW:** Verified for accurate commands, syntax, runtime versions, and zero false claims.
- **EDITORIAL_REVIEW:** Inspected for human voice, rhythm, elimination of repetitive filler, word count (1,400–2,000), and image relevance.
- **APPROVED:** Signed off by human editor or verified autonomous QA gate.
- **PUBLISHED:** Deployed live with verified HTTP 200 return and active Schema.org metadata.

*Rule:* If actual human peer review has not occurred, the article metadata must honestly declare `editorialStatus: "AI-assisted, pending human review"`. Never fabricate human review claims.

---

## 6. The Final Editorial Quality Test

Before advancing any article to `APPROVED` or `PUBLISHED`, the auditor must affirmatively answer:
1. Would a senior developer or technical learner find this genuinely useful in production?
2. Does it solve a specific problem with actionable code and configurations?
3. Is it completely free of artificial filler or robotic restatements?
4. Are all technical assertions and links verifiable?
5. Does it provide concrete value beyond a generic AI overview?

*If any answer is NO, the article is sent back to DRAFT for complete restructuring.*
