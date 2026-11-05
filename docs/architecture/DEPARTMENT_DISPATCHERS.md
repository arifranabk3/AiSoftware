# DEPARTMENT DISPATCHERS ARCHITECTURE

## 1. Dedicated Dispatchers for the 7 Departments

Each department has a dedicated dispatcher routing tasks into its specialized queue:

1. `ExecutiveDispatcher` -> Queue: `ceo_orchestrator_tasks`
2. `EngineeringDispatcher` -> Queue: `specialist_tasks`
3. `OperationsDispatcher` -> Queue: `system_maintenance`
4. `ProductMarketingDispatcher` -> Queue: `content_production`
5. `FinanceDispatcher` -> Queue: `specialist_tasks`
6. `BusinessDevDispatcher` -> Queue: `business_discovery`
7. `SecurityDispatcher` -> Queue: `specialist_tasks`

---

## 2. Dispatch Safeguards

- Verifies specialist eligibility, active status, and concurrency limits.
- Automatically flags tasks for owner approval if the target specialist requires human authorization (`approvalRequired: true`).
