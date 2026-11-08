# ADSENSE FIX IMPLEMENTATION PLAN & AUDIT LOG

**Execution Date:** 2026-11-08  
**Scope:** Remediation of detected AdSense approval blockers and content governance hardening

---

## 1. REMEDIATION MILESTONES

### Step 1: Legal & Trust Surface Consolidation
- **Target Files:**
  - `apps/web/src/app/privacy/page.tsx`
  - `apps/web/src/app/about/page.tsx`
  - `apps/web/src/app/contact/page.tsx`
  - `apps/web/src/app/terms/page.tsx`
- **Actions Completed:**
  - Removed all `.local` mock email references.
  - Standardized email across all legal documents to `support@ai-software.com`.
  - Added dedicated corporate correspondence details on the About page.

### Step 2: Content Governance & Filter Gates
- **Target Files:**
  - `apps/web/src/lib/articles.ts`
  - `apps/web/src/lib/date-utils.ts`
  - `apps/web/src/app/page.tsx`
  - `apps/web/src/app/articles/page.tsx`
  - `apps/web/src/app/articles/[slug]/page.tsx`
  - `apps/web/src/app/sitemap.ts`
- **Actions Completed:**
  - Implemented `getPublishedArticles()` filter that enforces `publicationStatus === 'Published'`, `editorialStatus === 'Approved'`, and `publishedAt <= now()`.
  - Bound the public Homepage, Archive, Static Route generator, and Sitemaps strictly to this utility.
  - Eliminated any risk of unapproved drafts, technical review notes, or speculative future articles appearing on public search crawlers.

### Step 3: Verified Asset Pipeline
- **Target Files:**
  - `apps/web/public/ads.txt`
  - `apps/web/src/app/layout.tsx`
  - `apps/web/public/sitemap.xml`
- **Actions Completed:**
  - Verified `ads.txt` syntax matches Google Publisher ID `pub-9578771297998223`.
  - Confirmed verification meta tag and official Google ad script are rendered cleanly in layout head.
  - Audited all 11 technical articles for 100% asset existence on disk (11 hero images, 22 diagrams).
