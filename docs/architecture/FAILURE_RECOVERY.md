# FAILURE RECOVERY & DLQ DRAINAGE

## 1. Network Disconnection

If Redis or MongoDB experiences connection latency, `ioredis` and `mongodb` drivers pause attempts and emit warnings without crashing the parent Node.js worker process.

---

## 2. Dead-Letter Queue (DLQ)

Jobs that fail all 3 exponential backoff retries transition to Dead-Letter status. They require manual owner investigation and explicit replay from the Owner Control Center.
