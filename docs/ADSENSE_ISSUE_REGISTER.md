# ADSENSE ISSUE REGISTER & REMEDIATION MATRIX

**Audit Date:** 2026-11-08  
**Audit Scope:** Public Web Architecture, Content Engine, Legal Pages, and Asset Pipelines

| Issue ID | Severity | Category | Description | Root Cause | Status | Resolution Detail |
|---|---|---|---|---|---|---|
| **ISS-01** | High | Security / Legal | Outdated placeholder email `contact@ai-software.local` on Privacy page. | Draft relic from early scaffolding. | ✅ **FIXED** | Replaced with verified operational inbox `support@ai-software.com`. |
| **ISS-02** | High | Trust & Authority | About page lacked explicit direct support email link. | Omission in footer contact reference. | ✅ **FIXED** | Added "Contact & Editorial Inquiries" section linking to `support@ai-software.com`. |
| **ISS-03** | Medium | Compliance | In-memory scheduler assumption in serverless environment. | Serverless workers terminate when idle; interval timers freeze. | ✅ **FIXED** | Implemented Hybrid Scheduler model with Vercel Cron hooks + Dashboard queue controls. |
| **ISS-04** | High | Policy Compliance | Risk of unapproved AI drafts leaking to public catalog. | Sitemaps and articles archive pulling raw array without status check. | ✅ **FIXED** | Introduced `getPublishedArticles()` utility with strict `editorialStatus: 'Approved'` and `publishedAt <= now()` gates. |
| **ISS-05** | Medium | User Experience | Missing image alt text or non-semantic figures on editorial layouts. | Editorial cards lacked descriptive aria and alt labels. | ✅ **FIXED** | All 11 articles audited for descriptive alt attributes, figure captions, and 1200x630 SVGs. |
| **ISS-06** | Medium | Technical SEO | Dynamic article routes without Schema.org JSON-LD structured publication times. | `datePublished` mapped to simple legacy date string without ISO-8601 UTC. | ✅ **FIXED** | Upgraded Schema.org JSON-LD to output UTC ISO timestamps with PKT presentation. |
