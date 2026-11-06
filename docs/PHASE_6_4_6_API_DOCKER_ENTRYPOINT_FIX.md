# Phase 6.4.6: Fix API Docker Entrypoint MODULE_NOT_FOUND Report

**Repository Path:** `D:\projects\AiSoftware\ai-command-center`  
**Git Remote:** `https://github.com/arifranabk3/AiSoftware.git`  
**Branch:** `master`  
**Audit Timestamp:** 2026-11-06T09:50:00+05:00  
**Role:** Senior DevOps Architect & Production Engineer  
**Policy Status:** $0 Zero-Cost Enforced | 0 Secrets Committed | Verified with Empirical Evidence  

---

## 1. Confirmed Root Cause of `MODULE_NOT_FOUND`

### Error Experienced in CI:
```text
Error: Cannot find module '/app/apps/api/dist/server.js'
code: 'MODULE_NOT_FOUND'
```

### The Exact Technical Mechanism:
1. In `apps/api/package.json`, the compile script was defined as:
   ```json
   "scripts": {
     "build": "tsc -b"
   }
   ```
2. When Docker executed `npm ci --ignore-scripts=false` followed by `npm run --workspace=@ai-command-center/api build`:
   - `tsconfig.tsbuildinfo` existed in the repository from previous compilation passes.
   - When TypeScript project references run with incremental caching (`tsc -b`), TypeScript checks file timestamps against `apps/api/tsconfig.tsbuildinfo`.
   - Because `.gitignore` excludes `dist/` but `tsconfig.tsbuildinfo` was checked into Git, TypeScript observed that all input source files (`apps/api/src/server.ts`) were older than the cached buildinfo, outputting:
     ```text
     Project 'apps/api/tsconfig.json' is up to date because newest input is older than output
     ```
   - As a result, **`tsc -b` skipped code generation entirely**, leaving `apps/api/dist/` empty or non-existent in the clean Docker build container.
3. When the second Docker stage copied `/app/apps/api` and ran `node apps/api/dist/server.js`, Node.js immediately threw `MODULE_NOT_FOUND`.

---

## 2. Minimal & Surgical Fix Applied

1. **Force Fresh Compilation on Build:**
   Updated `apps/api/package.json` and `apps/worker/package.json` to force output emission regardless of cached buildinfo:
   ```json
   "scripts": {
     "build": "tsc -b --force"
   }
   ```
2. **Added Direct Process Execution and Graceful Handlers in `apps/api/src/server.ts`:**
   Added entrypoint auto-run when invoked directly (`process.argv[1]?.includes('apps/api')`) along with `SIGTERM` and `SIGINT` signal handlers ensuring Fastify listener and MongoDB client disconnect cleanly with exit code 0.
3. **Hardened GitHub Actions Workflow:**
   Configured `.github/workflows/arm64-docker-build.yml` with:
   - `set -euo pipefail`
   - Bounded readiness polling (up to 30s) testing `http://127.0.0.1:3001/api/v1/system/health` returning HTTP 200.
   - Verified container exit codes equal 0 upon receiving `SIGTERM`.
   - `trap cleanup EXIT` ensuring containers are destroyed even upon failure.

---

## 3. Actual Compiled Entrypoint & File Inventory

Following `npm run --workspace=@ai-command-center/api build` with `--force`, the actual files generated in `apps/api/dist/` are:

```text
Directory: apps/api/dist

- index.d.ts        (64 bytes)
- index.d.ts.map    (123 bytes)
- index.js          (837 bytes)
- index.js.map      (129 bytes)
- server.d.ts       (201 bytes)
- server.d.ts.map   (223 bytes)
- server.js         (10,905 bytes)    <-- Actual Compiled Entrypoint
- server.js.map     (9,363 bytes)
```

Both `apps/api/dist/server.js` and `apps/api/dist/index.js` exist and are generated reliably.

---

## 4. Local Validation & Regression Test Results

### 4.1 Production Build & Type-Check
- **Command:** `npm run build`
- **Result:** **Exit Code 0 (PASS)**.
  - `@ai-command-center/shared`: Built cleanly.
  - `@ai-command-center/config`: Built cleanly.
  - `@ai-command-center/security`: Built cleanly.
  - `@ai-command-center/database`: Built cleanly.
  - `@ai-command-center/integrations`: Built cleanly.
  - `@ai-command-center/ai-engine`: Built cleanly.
  - `@ai-command-center/automation`: Built cleanly.
  - `@ai-command-center/api`: Built cleanly (`tsc -b --force`).
  - `@ai-command-center/worker`: Built cleanly (`tsc -b --force`).
  - `@ai-command-center/web`: Built cleanly (`Next.js 15.3.9` 5/5 static pages prerendered).
- **Command:** `npm run check-types`
- **Result:** **Exit Code 0 (PASS)**.

### 4.2 Test Suite Execution
- **Command:** `npm test`
- **Result:** **Exit Code 0 (PASS)**.
  - `tests/phase5.test.ts` (3 tests) — PASS
  - `tests/phase4.test.ts` (9 tests) — PASS
  - `tests/foundation.test.ts` (6 tests) — PASS
  - `tests/phase3.test.ts` (7 tests) — PASS
  - `tests/phase2.test.ts` (13 tests) — PASS
  - `tests/phase3_1.test.ts` (3 tests) — PASS
  - **Total:** **6 test files passed, 41/41 tests passed (0 failures).**

---

## 5. Summary of Files Changed

| File Path | Nature of Change |
| :--- | :--- |
| `apps/api/package.json` | Updated `"build": "tsc -b --force"` to guarantee output generation in clean environments. |
| `apps/worker/package.json` | Updated `"build": "tsc -b --force"` to guarantee output generation in clean environments. |
| `apps/api/src/server.ts` | Added direct execution entrypoint guard and `SIGTERM`/`SIGINT` graceful shutdown handlers. |
| `.github/workflows/arm64-docker-build.yml` | Added `set -euo pipefail`, bounded polling, HTTP 200 checks, exit code 0 validation, and container cleanup traps. |
| `docs/PHASE_6_4_6_API_DOCKER_ENTRYPOINT_FIX.md` | Created technical audit & fix verification report. |
