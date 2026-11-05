# CEO ORCHESTRATOR ARCHITECTURE

## 1. Overview

The CEO Orchestrator (`packages/ai-engine/src/ceo-orchestrator.ts`) is the central autonomous decision and routing engine. It receives high-level business objectives, evaluates feasibility through the Business Intelligence Engine, decomposes objectives into specialist tasks, dispatches them through department dispatchers, and supervises validation in an auditable state-machine loop.

---

## 2. The 14 Orchestrator States

1. `IDLE`: Resting state awaiting incoming business objectives.
2. `OBJECTIVE_RECEIVED`: New objective registered and parsed.
3. `ANALYZING`: Running zero-cost feasibility, market demand, and tooling analysis.
4. `PLANNING`: Constructing dependency graphs and step sequences.
5. `TASK_DECOMPOSITION`: Breaking objective into discrete tasks with input parameters.
6. `DEPARTMENT_ASSIGNMENT`: Routing to 1 of the 7 core department dispatchers.
7. `SPECIALIST_ASSIGNMENT`: Assigning to an eligible active specialist (from the 55 profiles).
8. `EXECUTION`: Invoking specialist prompt pipelines via the AI provider layer.
9. `RESULT_EVALUATION`: Validating JSON outputs, schemas, and success criteria.
10. `RETRY_OR_REASSIGN`: Handling transient failures within bounded retry limits.
11. `OWNER_APPROVAL_REQUIRED`: Pausing on sensitive, financial, or binding actions.
12. `COMPLETED`: Objective successfully achieved and recorded.
13. `FAILED`: Terminal failure logged with audit reasoning.
14. `EMERGENCY_HALTED`: Frozen immediately upon kill-switch activation.
