# QUEUE CONFIGURATION & TOPOLOGY

## 1. Registered Command Queues (10 Specialized Queues)

1. `ceo_orchestrator_tasks`: High-priority cross-department strategic dispatching.
2. `specialist_tasks`: Standard execution queue for the 55 dedicated specialist roles.
3. `business_discovery`: Automated mining of client requests, grant portals, and business opportunities.
4. `research_operations`: Data harvesting, competitor teardowns, and trend synthesis.
5. `content_production`: Multi-channel copy generation and draft preparation.
6. `seo_operations`: Metadata generation, keyword density checks, and sitemap auditing.
7. `publishing_operations`: Scheduled programmatic post distribution (requires owner approval).
8. `application_management`: Tailored proposal generation and form filling.
9. `notifications_dispatch`: Owner WhatsApp alerts and critical system banners.
10. `system_maintenance`: Log rotation, expired session cleanup, and quota audits.

---

## 2. Retry Policy & Dead-Letter Queue (DLQ)

- **Maximum Attempts:** 3 retries per task.
- **Backoff Strategy:** Exponential backoff starting at 2,000ms delay.
- **Dead-Letter Handling:** Failed jobs exceeding 3 attempts are captured in DLQ for owner review and cannot auto-retry infinitely.
