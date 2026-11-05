# DATABASE ARCHITECTURE (FINAL DECISION): MONGODB

## 1. Executive Summary & Final Decision

- **Selected Database:** **MongoDB** (Native Driver & Document Persistence).
- **Previous Proposal:** PostgreSQL (Prisma ORM) initially drafted in Phase 1/2.
- **Owner Directive:** All PostgreSQL dependencies superseded by MongoDB.

---

## 2. Distributed Document Schema Collections

1. `system_controls`: Shared persistent state for the emergency kill switch (`_id: 'GLOBAL_KILL_SWITCH'`), version counters, and audit actor stamps.
2. `scheduler_locks`: Unique atomic lease records (`_id: '${taskId}:${timestampMinute}'`) preventing duplicate executions across distributed nodes.
3. `worker_heartbeats`: Active daemon node leases, process IDs, and stale worker detection timestamps.
4. `departments`: 7 Core organizational departments.
5. `specialists`: 55 Specialist profiles (IDs 1–55) + 1 separate CEO Orchestrator.
6. `audit_logs`: Immutable cryptographically chained ledger documents.

---

## 3. Transactions & Replicaset Constraints

MongoDB multi-document ACID transactions require either a replica set or a shared sharded cluster. In standalone development deployments, atomic single-document updates (`findOneAndUpdate`, `updateOne` with `$inc` and unique indexes) are used to guarantee race-condition safety without incurring infrastructure costs.
