# SCHEDULER RELIABILITY & DISTRIBUTED LOCKS

## 1. Concurrency Problem

When multiple instances of the worker engine run across different processes or VMs, a scheduled job (e.g. daily SEO audit at 09:00) could trigger multiple times simultaneously.

---

## 2. Distributed Atomic Lock Architecture

- **Collection:** `scheduler_locks`
- **Primary Key:** `_id = ${taskId}:${currentMinuteTimestamp}`
- **Mechanism:**
  Worker nodes attempt an atomic `insertOne()` into `scheduler_locks`. Because `_id` has an inherent unique constraint in MongoDB, only the first node succeeds. Any competing nodes receive a duplicate key violation (`E11000`) and cleanly yield.
- **Lease Expiration:**
  Lock records carry an `expiresAt` timestamp (default 60s) to allow recovery if a worker dies mid-execution.
