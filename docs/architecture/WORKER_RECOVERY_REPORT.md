# WORKER RECOVERY REPORT & HEARTBEAT LEASING

## 1. Heartbeat Architecture

Every autonomous worker daemon node generates a unique ID on boot:
`worker_${process.pid}_${random}`

Every 5,000ms, the worker updates its status document in the MongoDB `worker_heartbeats` collection:

```json
{
  "_id": "worker_1234_abc",
  "hostname": "SERVER-01",
  "pid": 1234,
  "status": "ACTIVE",
  "lastHeartbeat": "2026-11-05T15:10:00Z",
  "activeJobCount": 1
}
```

---

## 2. Stale Worker Detection & Task Re-queue

- `detectStaleWorkers(timeoutSeconds = 30)` finds workers whose heartbeats have ceased.
- Abandoned jobs are unlocked by expiring their lock record in `scheduler_locks`, allowing surviving healthy worker nodes to recover the workload safely.
